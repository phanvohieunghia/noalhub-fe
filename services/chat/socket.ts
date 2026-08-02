import { io, type Socket } from "socket.io-client";

import { CHAT_NAMESPACE, WS_URL } from "../config";
import { ensureAccessToken } from "../client";
import { tokenStore } from "@/lib/auth/token-store";

/**
 * BIÊN CÔ LẬP của realtime — file DUY NHẤT trong codebase biết về Socket.IO.
 * Vai của nó giống `lib/auth/token-store.ts` với localStorage.
 *
 * Không import React, không biết React Query. Cầu nối sang cache nằm ở
 * `services/chat/hooks.ts` (`useChatSocket`).
 */

/** Ack không tự timeout — thiếu mốc này thì bubble kẹt "sending" vĩnh viễn. */
const ACK_TIMEOUT_MS = 10_000;

/** Gia hạn token trước khi hết hạn 60s, đừng chờ backend ngắt. */
const REFRESH_MARGIN_MS = 60_000;

let socket: Socket | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeToken: (() => void) | null = null;
/** Chặn nhiều lời gọi `connect()` chồng nhau cùng dựng hai socket. */
let connecting: Promise<Socket | null> | null = null;

export function getSocket(): Socket | null {
  return socket;
}

/**
 * Mở kết nối. Idempotent: gọi nhiều lần chỉ có một socket.
 *
 * Phải chờ có access token trước khi handshake — access token chỉ nằm trong
 * memory nên sau F5 nó rỗng, handshake với `token: null` là bị ngắt ngay.
 */
export function connectChatSocket(): Promise<Socket | null> {
  if (socket?.connected) return Promise.resolve(socket);
  if (connecting) return connecting;

  connecting = (async () => {
    const token = await ensureAccessToken();
    if (!token) return null;

    // Một lời gọi khác đã dựng xong socket trong lúc ta await.
    if (socket) return socket;

    socket = io(`${WS_URL}${CHAT_NAMESPACE}`, {
      // Token đi trong payload handshake, KHÔNG qua query string (query string
      // rơi vào access log của server).
      auth: { token },
      // Ép websocket: tránh yêu cầu sticky session ở load balancer khi backend
      // chạy nhiều instance. Đổi lại mất fallback long-polling ở vài môi
      // trường mạng chặn WebSocket — xem `docs/chat.md` §5.4.
      transports: ["websocket"],
      // Socket.IO đã có backoff + jitter sẵn. Không tự viết reconnect.
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
 * `TOKEN_EXPIRED` phải phân biệt với lỗi mạng: gặp nó thì xin token MỚI rồi
 * mới nối lại. Nối lại bằng token cũ là vòng lặp vô hạn có mã lỗi.
 */
function registerLifecycle(instance: Socket) {
  instance.on("connect", scheduleTokenRefresh);

  instance.on("disconnect", (reason) => {
    clearRefreshTimer();
    if (reason === "io server disconnect") {
      // Server chủ động ngắt → Socket.IO KHÔNG tự reconnect. Thường là token
      // hết hạn, nên lấy token mới rồi nối tay.
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

/** Cập nhật token cho lần handshake kế tiếp, và gia hạn phiên đang mở. */
function applyToken(token: string) {
  if (!socket) return;
  socket.auth = { token };
  if (socket.connected) {
    socket.emit("auth:refresh", { token });
  }
}

/**
 * Chủ động gia hạn: access token TTL 900s, kết nối sống lâu hơn thế. Chờ tới
 * lúc backend ngắt vì TOKEN_EXPIRED nghĩa là cứ 15 phút người dùng thấy một
 * nhịp "Mất kết nối".
 *
 * Mốc hết hạn đọc từ `exp` trong JWT — không phải từ `expiresIn` lúc login,
 * vì token có thể đã được refresh nhiều lần từ đó.
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
        // Xoá access token khỏi memory để `ensureAccessToken` buộc phải refresh
        // — nó dùng single-flight của tầng HTTP, nên không đua với REST.
        const fresh = await ensureAccessToken();
        if (fresh) applyToken(fresh);
        scheduleTokenRefresh();
      })();
    },
    Math.max(delay, 1_000),
  );
}

/** Token đổi do REST tự refresh → gia hạn phiên socket ngay, đừng chờ hẹn giờ. */
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
 * Đọc `exp` (giây) từ payload JWT. Chỉ để hẹn giờ gia hạn — KHÔNG dùng cho
 * quyết định bảo mật nào; chữ ký không được verify ở client.
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
 * Cầu debug cho DevTools console: `__chatSocket.disconnect()`.
 *
 * Chỉ gắn ngoài production — đây là lối tắt để thử tay các nhánh mất kết nối,
 * KHÔNG phải API cho component. Component vẫn đi qua `useChatSocket`; gọi
 * `disconnect()` từ console sẽ không dọn ephemeral store, đúng như một cú rớt
 * mạng thật.
 */
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as Window & { __chatSocket?: unknown }).__chatSocket = {
    get: getSocket,
    connect: connectChatSocket,
    disconnect: disconnectChatSocket,
  };
}

/**
 * Emit có ack + timeout. Trả về payload ack thô — người gọi tự validate bằng
 * zod (`sendMessageAckSchema`).
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

/** Emit "bắn và quên" — dùng cho typing, thứ được phép rơi. */
export function emitFireAndForget(event: string, payload: unknown) {
  if (!socket?.connected) return;
  socket.emit(event, payload);
}
