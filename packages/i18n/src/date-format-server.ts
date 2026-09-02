import { formatDate, formatDateTime } from "@noalhub/core/format-date";
import { getLocale } from "next-intl/server";

import { DEFAULT_LOCALE, isLocale } from "./config";
import { intlLocale } from "./formats";

/**
 * The `async` counterpart of `useDateFormat`, for **async Server Components**.
 *
 * Two versions rather than one: a hook cannot be called inside an `async
 * function` component, and `getLocale()` cannot be used on the client. Both sit
 * on the same `formatDate` underneath, so they cannot disagree.
 */
export async function getDateFormat() {
  const locale = await getLocale();
  const tag = intlLocale(isLocale(locale) ? locale : DEFAULT_LOCALE);

  return {
    date: (value?: string | null) => formatDate(tag, value),
    dateTime: (value?: string | null) => formatDateTime(tag, value),
  };
}
