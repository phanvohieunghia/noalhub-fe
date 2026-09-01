import { cookies } from "next/headers";

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { formats } from "./formats";
import { loadAllMessages } from "./messages";

/**
 * Cấu hình cho `apps/web`. `requestLocale` là giá trị của segment `[locale]`.
 *
 * Segment này bắt cả những đường dẫn rác (`/unknown.txt`) nên **phải** kiểm tra
 * lại thay vì tin — next-intl ghi rõ điều đó ở `GetRequestConfigParams`.
 *
 * (`requestLocale` đã bị next-intl đánh dấu deprecated để chuyển sang
 * `next/root-params`. Chưa chuyển được: Next 16 đã gỡ `unstable_rootParams` và
 * bản thay thế chưa ra — xem `docs/01-app/02-guides/upgrading/version-16.md`.)
 */
export async function webRequestConfig(requestLocale: Promise<string | undefined>) {
  const requested = await requestLocale;
  const locale: Locale = isLocale(requested) ? requested : DEFAULT_LOCALE;

  return { locale, formats, messages: await loadAllMessages(locale) };
}

/**
 * Cấu hình cho `apps/admin`: không có segment `[locale]`, nên locale lấy từ
 * cookie. Admin nằm sau đăng nhập và không được index, nên URL không cần phân
 * biệt ngôn ngữ (`docs/i18n-plan.md` §3.2).
 */
export async function adminRequestConfig() {
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookie) ? cookie : DEFAULT_LOCALE;

  return { locale, formats, messages: await loadAllMessages(locale) };
}
