import { defineRouting } from "next-intl/routing";

import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
} from "./config";

/**
 * Cấu hình định tuyến của **`apps/web`**. `apps/admin` KHÔNG dùng file này: nó
 * không có segment `[locale]`, locale đọc thẳng từ cookie (`docs/i18n-plan.md`
 * §3.2).
 *
 * `localePrefix: "always"` — `/vi/blogs/x` và `/en/blogs/x` là hai URL khác
 * nhau, nên mỗi bản có canonical và `hreflang` riêng. `as-needed` (vi không
 * prefix) làm sitemap và cache nginx phức tạp hơn hẳn mà chỉ được cái URL đẹp.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",

  /*
   * Dùng chung tên cookie với admin để đổi ngôn ngữ ở một app là app kia cũng
   * theo (cùng domain ở production). `httpOnly` mặc định là false — đúng ý:
   * `LanguageSwitcher` ghi cookie ngay ở client rồi mới điều hướng.
   */
  localeCookie: {
    name: LOCALE_COOKIE,
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  },
});
