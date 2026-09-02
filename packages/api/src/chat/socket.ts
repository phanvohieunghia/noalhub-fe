import { io, type Socket } from "socket.io-client";

import { CHAT_NAMESPACE, WS_URL } from "../config";
import { ensureAccessToken } from "../client";
import { tokenStore } from "../auth/token-store";

/**
 * Realtime's ISOLATION BOUNDARY — the ONLY file in the codebase that knows about
 * Socket.IO. It plays the same role `lib/auth/token-store.ts` plays for
 * localStorage.
 *
 * It imports no React and knows nothing of React Query. The bridge to the cache
 * lives in `services/chat/hooks.ts` (`useChatSocket`).
 */

/** Acks do not time out on their own — without this, a bubble is stuck "sending" forever. */
const ACK_TIMEOUT_MS = 10_000;

/** Renew the token 60s before it expires; do not wait for the backend to disconnect. */
const REFRESH_MARGIN_MS = 60_000;

let socket: Socket | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeToken: (() => void) | null = null;
/** Stops overlapping `connect()` calls from building two sockets. */
let connecting: Promise<Socket | null> | null = null;

export function getSocket(): Socket | null {
  return socket;
}

/**
 * Opens the connection. Idempotent: any number of calls yield one socket.
 *
 * It has to wait for an access token before the handshake — the access token
 * lives in memory only, so after F5 it is empty, and a handshake with
 * `token: null` is disconnected immediately.
 */
export function connectChatSocket(): Promise<Socket | null> {
  if (socket?.connected) return Promise.resolve(socket);
  if (connecting) return connecting;

  connecting = (async () => {
    const token = await ensureAccessToken();
    if (!token) return null;

    // Another call finished building the socket while we awaited.
    if (socket) return socket;

    socket = io(`${WS_URL}${CHAT_NAMESPACE}`, {
      // The token rides in the handshake payload, NOT in the query string
      // (query strings end up in the server's access log).
      auth: { token },
      // Force websocket: avoids needing sticky sessions at the load balancer
      // when the backend runs several instances. The trade is losing the
      // long-polling fallback on networks that block WebSocket — see
      // `docs/chat.md` §5.4.
      transports: ["websocket"],
      // Socket.IO already has backoff plus jitter. Do not hand-write reconnect.
      reconnection: true,
      reconnectionDelayMax: 30_000,
    });

    registerLifecycle(socket);
    scheduleTokenRefresh();
    watchTokenChanges();

    return socket;
  })();

  connecting.finally(() => {
    connecting = null;
  });

  return connecting;
}

export function disconnectChatSocket() {
  clearRefreshTimer();
  unsubscribeToken?.();
  unsubscribeToken = null;
  socket?.disconnect();
  socket = null;
}

/**
 * `TOKEN_EXPIRED` has to be told apart from a network failure: on that, get a
 * FRESH token before reconnecting. Reconnecting with the old token is an
 * infinite loop with an error code attached.
 */
function registerLifecycle(instance: Socket) {
  instance.on("connect", scheduleTokenRefresh);

  instance.on("disconnect", (reason) => {
    clearRefreshTimer();
    if (reason === "io server disconnect") {
      // The server disconnected us → Socket.IO does NOT reconnect on its own.
      // It is usually an expired token, so fetch a fresh one and reconnect by
      // hand.
      void reconnectWithFreshToken();
    }
  });

  instance.on("connect_error", (error) => {
    const code = (error as Error & { data?: { code?: string } }).data?.code;
    if (code === "TOKEN_EXPIRED" || code === "UNAUTHENTICATED") {
      void reconnectWithFreshToken();
    }
  });
}

async function reconnectWithFreshToken() {
  const token = await ensureAccessToken();
  if (!token || !socket) return;
  applyToken(token);
  socket.connect();
}

/** Updates the token for the next handshake and renews the open session. */
function applyToken(token: string) {
  if (!socket) return;
  socket.auth = { token };
  if (socket.connected) {
    socket.emit("auth:refresh", { token });
  }
}

/**
 * Proactive renewal: the access token's TTL is 900s and the connection outlives
 * that. Waiting for the backend to disconnect on TOKEN_EXPIRED means the user
 * sees a "Disconnected" blip every 15 minutes.
 *
 * The expiry is read from the JWT's `exp` — not from login's `expiresIn`, since
 * the token may have been refreshed several times since.
 */
function scheduleTokenRefresh() {
  clearRefreshTimer();

  const token = tokenStore.getAccess();
  if (!token) return;

  const expiresAt = readJwtExpiry(token);
  if (!expiresAt) return;

  const delay = expiresAt - Date.now() - REFRESH_MARGIN_MS;
  refreshTimer = setTimeout(
    () => {
      void (async () => {
        // Clear the access token from memory so `ensureAccessToken` is forced to
        // refresh — it uses the HTTP layer's single-flight, so it never races
        // with REST.
        const fresh = await ensureAccessToken();
        if (fresh) applyToken(fresh);
        scheduleTokenRefresh();
      })();
    },
    Math.max(delay, 1_000),
  );
}

/** REST refreshed the token → renew the socket session at once, do not wait for the timer. */
function watchTokenChanges() {
  unsubscribeToken?.();
  unsubscribeToken = tokenStore.subscribe((token) => {
    if (!token) return;
    applyToken(token);
    scheduleTokenRefresh();
  });
}

function clearRefreshTimer() {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = null;
}

/**
 * Reads `exp` (in seconds) from the JWT payload. For scheduling renewal ONLY —
 * never for a security decision; the signature is not verified on the client.
 */
function readJwtExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * A debug bridge for the DevTools console: `__chatSocket.disconnect()`.
 *
 * Attached outside production only — a shortcut for exercising the
 * disconnection branches by hand, NOT an API for components. Components still
 * go through `useChatSocket`; calling `disconnect()` from the console does not
 * clear the ephemeral store, exactly like a real network drop.
 */
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as Window & { __chatSocket?: unknown }).__chatSocket = {
    get: getSocket,
    connect: connectChatSocket,
    disconnect: disconnectChatSocket,
  };
}

/**
 * An emit with an ack and a timeout. Returns the raw ack payload — the caller
 * validates it with zod (`sendMessageAckSchema`).
 */
export async function emitWithAck<T>(
  event: string,
  payload: unknown,
): Promise<T> {
  const instance = socket;
  if (!instance?.connected) {
    throw new Error("SOCKET_OFFLINE");
  }
  return instance.timeout(ACK_TIMEOUT_MS).emitWithAck(event, payload) as Promise<T>;
}

/** A fire-and-forget emit — for typing, which is allowed to be dropped. */
export function emitFireAndForget(event: string, payload: unknown) {
  if (!socket?.connected) return;
  socket.emit(event, payload);
}
