import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ZodType } from "zod";

import { API_BASE_URL } from "./config";
import { ApiError, ERROR_CODES } from "./errors";
import type { ApiErrorBody } from "./errors";
import { tokenStore } from "./auth/token-store";
import { tokenPairSchema } from "./auth/schemas";
import type { AuthTokens } from "./auth/types";

/**
 * Adds app-specific options to axios' config, so the service layer can call
 * `http.get/post` directly while still declaring "this needs a token" and
 * "validate with this schema" — with no extra wrapper functions.
 *
 * `authRequired` must NOT be named `auth`: axios already uses that key for HTTP
 * Basic (`{ username, password }`).
 */
declare module "axios" {
  export interface AxiosRequestConfig {
    /** Attaches `Authorization: Bearer <access>` and enables refresh-on-401. */
    authRequired?: boolean;
    /** Validates the response with zod — catching a backend shape change on the spot. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema?: ZodType<any>;
    /** Internal: marks a request as already retried after a refresh. */
    isRetry?: boolean;
  }
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * A separate instance for `/auth/refresh`: it has no 401 interceptor, so it
 * cannot recurse into itself.
 */
const refreshHttp = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * Registered by `lib/auth/store.ts`. Routed through a callback so the client
 * never imports the store (avoiding a circular dependency).
 */
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

function expireSession() {
  tokenStore.clear();
  onSessionExpired?.();
}

/**
 * Single-flight: when N requests hit a 401 together, /auth/refresh is called
 * exactly ONCE. The backend ROTATES refresh tokens and presenting an old one
 * revokes the ENTIRE session — so parallel calls actually lose the session,
 * they are not merely wasteful.
 */
let refreshPromise: Promise<AuthTokens> | null = null;

function refreshTokens(): Promise<AuthTokens> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = withRefreshLock(async () => {
    // RE-READ storage AFTER winning the lock. If another tab rotated while we
    // queued, the token read before locking is already dead — presenting it
    // reports us as a replay.
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) {
      throw new ApiError(401, {
        code: ERROR_CODES.unauthenticated,
        message: "common.errors.sessionExpired",
        statusCode: 401,
      });
    }

    const { data } = await refreshHttp.post("/auth/refresh", { refreshToken });
    const tokens = tokenPairSchema.parse(data);
    tokenStore.setTokens(tokens);
    return tokens;
  });

  refreshPromise
    .catch(() => {})
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

/**
 * A cross-tab lock around one rotation.
 *
 * `refreshPromise` above only guards multiple requests WITHIN one tab. But the
 * access token lives in memory only, so **every tab reload forces exactly one
 * rotation** — two tabs on the same origin hitting F5 means two parallel
 * rotations on one refresh token. The backend locks the DB row, so they queue
 * rather than race: the first tab rotates successfully, the second presents the
 * token that was just revoked. That is not a rare race but a CERTAIN outcome,
 * and before the backend had a grace window it revoked the whole family —
 * a permanent logout.
 *
 * The Web Locks API holds the lock per origin and releases it when the tab
 * dies, even one closed mid-flight — something a localStorage flag cannot do (a
 * dead tab leaves the flag stuck forever). Browsers without it run straight
 * through: the cross-tab guard is lost, but the backend's grace window still
 * covers it.
 */
function withRefreshLock<T>(run: () => Promise<T>): Promise<T> {
  const locks = globalThis.navigator?.locks;
  if (!locks) return run();
  // Cast: `request`'s typing infers T = Promise<AuthTokens>, adding a layer of nesting.
  return locks.request("noalhub.auth.refresh", run) as Promise<T>;
}

/**
 * Returns a usable access token, refreshing when memory is empty (just after a
 * reload — the access token lives in memory only).
 *
 * This is the ONLY door through which the socket layer gets a token. The socket
 * must NOT call `/auth/refresh` itself: the backend rotates refresh tokens and
 * presenting an old one revokes the ENTIRE session — running alongside the
 * single-flight here really loses the session, it is not just a wasted request.
 */
export async function ensureAccessToken(): Promise<string | null> {
  const current = tokenStore.getAccess();
  if (current) return current;
  if (!tokenStore.getRefresh()) return null;

  try {
    const tokens = await refreshTokens();
    return tokens.accessToken;
  } catch {
    expireSession();
    return null;
  }
}

/** Attaches `Authorization: Bearer <access>` to requests marked `authRequired`. */
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.authRequired) {
    const accessToken = tokenStore.getAccess();
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/**
 * Success branch: validate with `config.schema` when present, and map 204 to
 * `undefined` (axios returns an empty string for an empty body).
 *
 * Error branch: normalization plus refresh-on-401. Every error leaving this
 * interceptor is an `ApiError` (except cancellation — `CanceledError` is passed
 * through so React Query reads it as an abort rather than a real failure).
 */
http.interceptors.response.use(
  (response) => {
    if (response.status === 204) {
      response.data = undefined;
    } else if (response.config.schema) {
      response.data = response.config.schema.parse(response.data);
    }
    return response;
  },
  async (error: unknown) => {
    if (axios.isCancel(error)) throw error;
    if (!(error instanceof AxiosError)) throw error;

    const config = error.config;

    // No response means the connection never happened (DNS, CORS, dead network).
    if (!error.response) {
      throw new ApiError(0, {
        code: "NETWORK_ERROR",
        message: "common.errors.noConnection",
        statusCode: 0,
      });
    }

    const { status } = error.response;

    if (status === 401 && config?.authRequired && !config.isRetry) {
      try {
        await refreshTokens();
      } catch {
        expireSession();
        throw new ApiError(401, {
          code: ERROR_CODES.unauthenticated,
          message: "common.errors.sessionExpired",
          statusCode: 401,
        });
      }
      // Retry EXACTLY once — isRetry stops an infinite loop.
      config.isRetry = true;
      return http.request(config);
    }

    if (status === 401 && config?.authRequired && config.isRetry) {
      expireSession();
    }

    throw new ApiError(status, readErrorBody(error.response.data, status));
  },
);

function readErrorBody(data: unknown, status: number): ApiErrorBody {
  if (
    data &&
    typeof data === "object" &&
    typeof (data as ApiErrorBody).message === "string" &&
    typeof (data as ApiErrorBody).code === "string"
  ) {
    return data as ApiErrorBody;
  }
  return {
    code: fallbackCodeFor(status),
    message: defaultMessageFor(status),
    statusCode: status,
  };
}

function fallbackCodeFor(status: number): string {
  if (status === 401) return ERROR_CODES.unauthenticated;
  if (status === 429) return ERROR_CODES.rateLimited;
  return "UNKNOWN";
}

/**
 * The fallback text when the backend sends no `message`.
 *
 * Returns an **i18n key**, not a sentence: `client.ts` is an app-level module
 * with no locale. `useMessage()` in the component translates it; a sentence sent
 * by the backend matches no key and passes straight through (`docs/i18n.md`
 * §7.3).
 */
function defaultMessageFor(status: number): string {
  if (status === 401) return "common.errors.sessionExpired";
  if (status === 403) return "common.errors.forbiddenAction";
  if (status === 404) return "common.errors.resourceNotFound";
  if (status === 429) return "common.errors.tooFast";
  if (status >= 500) return "common.errors.serverError";
  return "common.errors.unknown";
}
