/**
 * Every path in the OpenAPI spec sits under an `/api` prefix
 * (`/api/auth/login`, `/api/chat/conversations`) — the spec declares no
 * `servers`, so that prefix is folded into the baseURL ONCE here, and the api
 * layer writes paths WITHOUT `/api` (`/auth/login`, `/chat/conversations`).
 *
 * The env var holds an origin only, never `/api`: changing hosts in production
 * should not require remembering the suffix.
 */
let customApiOrigin: string | null = null;
let customWsUrl: string | null = null;

const configListeners = new Set<() => void>();

/**
 * Configure API origin and WebSocket URL dynamically at runtime (e.g. for React Native / Expo).
 * If not called, falls back to `process.env.NEXT_PUBLIC_API_BASE_URL` / `process.env.NEXT_PUBLIC_WS_URL`.
 */
export function configureApi(input: { apiOrigin: string; wsUrl?: string }): void {
  customApiOrigin = input.apiOrigin;
  if (input.wsUrl) {
    customWsUrl = input.wsUrl;
  }
  for (const listener of configListeners) {
    try {
      listener();
    } catch {
      /* ignored */
    }
  }
}

export function onApiConfigChange(cb: () => void): () => void {
  configListeners.add(cb);
  return () => configListeners.delete(cb);
}

/**
 * Normalize down to a bare ORIGIN and re-attach `/api`: strip any trailing `/`
 * and strip an `/api` suffix the env may already carry. So
 * `http://localhost:3101` and `http://localhost:3101/api` produce the same
 * result — however the env is written, it never becomes `/api/api`.
 *
 * Extracted into a function because `blog/server.ts` has to normalize **a
 * different origin**: `API_INTERNAL_URL` (a runtime variable pointing into the
 * docker network, see `docs/blog.md` §4.3). Two places under one rule must
 * share one function.
 */
export function apiBaseUrlFrom(rawOrigin: string): string {
  return `${rawOrigin.replace(/\/+$/, "").replace(/\/api$/, "")}/api`;
}

export function getApiOrigin(): string {
  if (customApiOrigin) return customApiOrigin.replace(/\/+$/, "").replace(/\/api$/, "");
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3101";
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
}

export function getApiBaseUrl(): string {
  if (customApiOrigin) return apiBaseUrlFrom(customApiOrigin);
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3101";
  return apiBaseUrlFrom(raw);
}

export function getWsUrl(): string {
  if (customWsUrl) return customWsUrl;
  return process.env.NEXT_PUBLIC_WS_URL ?? getApiOrigin().replace(/^http/, "ws");
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Socket.IO connects to the ORIGIN, not to `/api`: its handshake goes through
 * `/socket.io/`, and the `/chat` in `io(url)` is a NAMESPACE rather than an
 * HTTP path (calling `GET /chat/` directly answers 404 — do not go hunting for
 * a bug there).
 *
 * A separate variable because production usually differs in host/scheme
 * (`wss://`).
 */
export const WS_URL = getWsUrl();

/**
 * The internal Storybook, shown as a link on the admin screen that manages who
 * may open it. Display only — nothing here calls it, and it lives on a domain
 * this app never talks to.
 *
 * The default IS the production URL, so no build arg is needed; the env var
 * exists for a preview deployment on another domain. Like every
 * `NEXT_PUBLIC_*`, it is inlined at build time — setting it at runtime does
 * nothing.
 */
export const STORYBOOK_INTERNAL_URL =
  process.env.NEXT_PUBLIC_STORYBOOK_INTERNAL_URL ??
  "https://storybook-noalhub.duckdns.org/internal/";

/** The chat layer's Socket.IO namespace. */
export const CHAT_NAMESPACE = "/chat";
