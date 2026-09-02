import { webRequestConfig } from "@noalhub/i18n/request";
import { getRequestConfig } from "next-intl/server";

/**
 * next-intl's entry point for each request. The file location is
 * `createNextIntlPlugin`'s convention in `next.config.ts` — move it and the new
 * path must be declared there.
 *
 * The body lives in `@noalhub/i18n` because admin needs the same
 * message-loading logic, differing only in how the locale is found.
 */
export default getRequestConfig(({ requestLocale }) => webRequestConfig(requestLocale));
