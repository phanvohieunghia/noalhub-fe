/**
 * Every path in the OpenAPI spec sits under an `/api` prefix
 * (`/api/auth/login`, `/api/chat/conversations`) — the spec declares no
 * `servers`, so that prefix is folded into the baseURL ONCE here, and the api
 * layer writes paths WITHOUT `/api` (`/auth/login`, `/chat/conversations`).
 *
 * The env var holds an origin only, never `/api`: changing hosts in production
 * should not require remembering the suffix.
 */
const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3101";

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

const API_ORIGIN = RAW_API_BASE_URL.replace(/\/+$/, "").replace(/\/api$/, "");

export const API_BASE_URL = apiBaseUrlFrom(RAW_API_BASE_URL);

/**
 * Socket.IO connects to the ORIGIN, not to `/api`: its handshake goes through
 * `/socket.io/`, and the `/chat` in `io(url)` is a NAMESPACE rather than an
 * HTTP path (calling `GET /chat/` directly answers 404 — do not go hunting for
 * a bug there).
 *
 * A separate variable because production usually differs in host/scheme
 * (`wss://`).
 */
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? API_ORIGIN.replace(/^http/, "ws");

/** The chat layer's Socket.IO namespace. */
export const CHAT_NAMESPACE = "/chat";
