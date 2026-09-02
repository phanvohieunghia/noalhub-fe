import type { AuthTokens } from "./types";

/**
 * AN ISOLATION BOUNDARY — the only file in the codebase allowed to touch
 * localStorage.
 *
 * The access token lives in a module variable (memory): lost on reload, but out
 * of reach of "read the storage" XSS. The refresh token has to survive a reload
 * and therefore lives in localStorage.
 *
 * To move to httpOnly cookies plus a BFF later: rewrite this one file, and no
 * component has to change.
 */

const REFRESH_KEY = "nh.refresh";

let accessToken: string | null = null;

/**
 * Listeners for access-token changes. The socket layer needs them so it can
 * emit `auth:refresh` — a socket connection outlives the access token (15 min
 * TTL), and without a renewal the backend disconnects it with TOKEN_EXPIRED.
 */
const accessListeners = new Set<(token: string | null) => void>();

function notify() {
  for (const listener of accessListeners) {
    // One listener throwing must not block the remaining listeners.
    try {
      listener(accessToken);
    } catch {
      /* ignored */
    }
  }
}

export const tokenStore = {
  getAccess: (): string | null => accessToken,

  setAccess(token: string) {
    accessToken = token;
    notify();
  },

  setTokens(tokens: AuthTokens) {
    accessToken = tokens.accessToken;
    if (typeof window !== "undefined") {
      localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    }
    notify();
  },

  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_KEY);
  },

  clear() {
    accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(REFRESH_KEY);
    }
    notify();
  },

  /**
   * Subscribe to access-token changes. Returns an unsubscribe function.
   *
   * The callback receives the NEW token, including `null` (on clear) — what to
   * do with null is the listener's call, do not filter it out here.
   */
  subscribe(callback: (token: string | null) => void): () => void {
    accessListeners.add(callback);
    return () => accessListeners.delete(callback);
  },

  /**
   * Cross-tab sync: another tab cleared the refresh token (logout) → this tab
   * must sign out too. Returns an unsubscribe function.
   */
  onExternalClear(callback: () => void): () => void {
    if (typeof window === "undefined") return () => {};

    const handler = (event: StorageEvent) => {
      // event.key === null means localStorage.clear()
      if (event.key !== null && event.key !== REFRESH_KEY) return;
      if (event.newValue === null) {
        accessToken = null;
        notify();
        callback();
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};
