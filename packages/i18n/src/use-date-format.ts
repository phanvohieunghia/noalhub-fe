import { formatDate, formatDateTime } from "@noalhub/core/format-date";
import { useLocale } from "next-intl";

import { intlLocale } from "./formats";
import { DEFAULT_LOCALE, isLocale } from "./config";

/**
 * Two date formatters already bound to the current request's locale.
 *
 * Works in **both** Server and Client Components — next-intl's `useLocale()`
 * has two implementations and both return the locale being rendered.
 *
 * This is the **only** way to format a date in the app: calling
 * `formatDate(locale, value)` directly makes every call site source its own
 * locale, and wherever that is forgotten the dates stay Vietnamese forever
 * (`docs/i18n.md` §7.1).
 */
export function useDateFormat() {
  const locale = useLocale();
  const tag = intlLocale(isLocale(locale) ? locale : DEFAULT_LOCALE);

  return {
    date: (value?: string | null) => formatDate(tag, value),
    dateTime: (value?: string | null) => formatDateTime(tag, value),
  };
}
