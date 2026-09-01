import { formatDate, formatDateTime } from "@noalhub/core/format-date";
import { getLocale } from "next-intl/server";

import { DEFAULT_LOCALE, isLocale } from "./config";
import { intlLocale } from "./formats";

/**
 * Bản `async` của `useDateFormat`, cho **Server Component bất đồng bộ**.
 *
 * Hai bản chứ không một: hook không gọi được trong `async function` component,
 * còn `getLocale()` thì không dùng được ở client. Cùng một `formatDate` bên
 * dưới nên hai đường không thể ra kết quả khác nhau.
 */
export async function getDateFormat() {
  const locale = await getLocale();
  const tag = intlLocale(isLocale(locale) ? locale : DEFAULT_LOCALE);

  return {
    date: (value?: string | null) => formatDate(tag, value),
    dateTime: (value?: string | null) => formatDateTime(tag, value),
  };
}
