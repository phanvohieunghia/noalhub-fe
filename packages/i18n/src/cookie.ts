import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale, type Locale } from "./config";

/**
 * Write the locale cookie from the **client**. Deliberately not `HttpOnly`
 * (§4.2): writing it here lets `LanguageSwitcher` switch the UI immediately
 * instead of waiting a full request round-trip for the server to write it.
 *
 * `Secure` is only set on HTTPS — setting it unconditionally makes the browser
 * drop the cookie on `http://localhost`, so language switching breaks in dev.
 */
export function writeLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

export function readLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)`),
  );
  const value = match?.[1];
  return isLocale(value) ? value : null;
}
