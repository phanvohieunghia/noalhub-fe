export const DEFAULT_REDIRECT = "/chat";

/**
 * Accepts internal paths only. Without this,
 * `/login?next=https://evil.com` becomes an open-redirect hole.
 */
export function safeRedirect(
  next: string | null | undefined,
  /**
   * Where to go when `next` is absent or unsafe. `DEFAULT_REDIRECT` is an
   * `apps/web` route; `apps/admin` passes its own destination in here rather
   * than reimplementing the open-redirect check.
   */
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  // Browsers read both `//evil.com` and `/\evil.com` as protocol-relative.
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/**
 * The OAuth flow goes through the provider and returns to a callback configured
 * by the BACKEND — the spec takes no `redirect_uri`, so `next` cannot ride
 * along in the query string. It is parked in sessionStorage instead: alive only
 * in the tab doing the handshake, gone when that tab closes.
 */
const OAUTH_NEXT_KEY = "nh.oauth.next";

export function rememberOAuthNext(next: string | undefined) {
  if (typeof window === "undefined" || !next) return;
  sessionStorage.setItem(OAUTH_NEXT_KEY, safeRedirect(next));
}

export function takeOAuthNext(): string {
  if (typeof window === "undefined") return DEFAULT_REDIRECT;
  const next = sessionStorage.getItem(OAUTH_NEXT_KEY);
  sessionStorage.removeItem(OAUTH_NEXT_KEY);
  return safeRedirect(next);
}
