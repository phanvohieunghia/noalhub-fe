import { cookies } from "next/headers";

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { formats } from "./formats";
import { loadAllMessages } from "./messages";

/**
 * Config for `apps/web`. `requestLocale` is the value of the `[locale]` segment.
 *
 * That segment also catches junk paths (`/unknown.txt`), so it **must** be
 * validated rather than trusted — next-intl says as much in
 * `GetRequestConfigParams`.
 *
 * (next-intl has deprecated `requestLocale` in favour of `next/root-params`.
 * We cannot move yet: Next 16 removed `unstable_rootParams` and the
 * replacement is not out — see `docs/01-app/02-guides/upgrading/version-16.md`.)
 */
export async function webRequestConfig(requestLocale: Promise<string | undefined>) {
  const requested = await requestLocale;
  const locale: Locale = isLocale(requested) ? requested : DEFAULT_LOCALE;

  return { locale, formats, messages: await loadAllMessages(locale) };
}

/**
 * Config for `apps/admin`: there is no `[locale]` segment, so the locale comes
 * from the cookie. Admin sits behind login and is never indexed, so its URLs do
 * not need to distinguish languages (`docs/i18n.md` §3.2).
 */
export async function adminRequestConfig() {
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookie) ? cookie : DEFAULT_LOCALE;

  return { locale, formats, messages: await loadAllMessages(locale) };
}
