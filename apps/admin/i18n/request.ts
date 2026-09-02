import { adminRequestConfig } from "@noalhub/i18n/request";
import { getRequestConfig } from "next-intl/server";

/**
 * Admin has no `[locale]` segment (`docs/i18n.md` §3.2), so `requestLocale` is
 * ignored — the locale comes from the `NOALHUB_LOCALE` cookie.
 */
export default getRequestConfig(() => adminRequestConfig());
