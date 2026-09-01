import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale, type Locale } from "./config";

/**
 * Ghi cookie locale từ **client**. Cố ý không `HttpOnly` (§4.2): ghi được ngay
 * ở đây thì `LanguageSwitcher` đổi giao diện tức thì, không phải đợi một vòng
 * request chỉ để server ghi hộ.
 *
 * `Secure` chỉ bật khi đang chạy HTTPS — bật vô điều kiện thì cookie bị trình
 * duyệt bỏ qua ở `http://localhost` và dev không đổi được ngôn ngữ.
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
