import { defineRouting } from "next-intl/routing";

import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
} from "./config";

/**
 * Routing config for **`apps/web`**. `apps/admin` does NOT use this file: it
 * has no `[locale]` segment and reads the locale straight from the cookie
 * (`docs/i18n.md` §3.2).
 *
 * `localePrefix: "always"` — `/vi/blogs/x` and `/en/blogs/x` are two different
 * URLs, so each gets its own canonical and `hreflang`. `as-needed` (no prefix
 * for vi) makes the sitemap and the nginx cache markedly more complex and buys
 * only prettier URLs.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",

  /*
   * The cookie name is shared with admin so that changing the language in one
   * app carries over to the other (same domain in production). `httpOnly`
   * defaults to false, which is what we want: `LanguageSwitcher` writes the
   * cookie on the client and only then navigates.
   */
  localeCookie: {
    name: LOCALE_COOKIE,
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  },
});
