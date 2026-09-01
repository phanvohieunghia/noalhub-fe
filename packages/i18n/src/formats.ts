import type { Locale } from "./config";

/**
 * Định dạng dùng chung, khai một lần cho cả hai app. Truyền vào `formats` của
 * `getRequestConfig` nên `useFormatter().dateTime(d, "long")` ở bất kỳ đâu cũng
 * ra cùng một kiểu.
 */
export const formats = {
  dateTime: {
    short: { dateStyle: "short" },
    long: { dateStyle: "long" },
    full: { dateStyle: "long", timeStyle: "short" },
  },
} as const;

/**
 * BCP-47 tag để đưa cho `Intl.*`. `vi` một mình cũng chạy, nhưng bản có vùng
 * cho đúng thứ tự ngày/tháng và dấu phân cách nhóm số của khu vực.
 */
const INTL_LOCALES: Record<Locale, string> = {
  vi: "vi-VN",
  en: "en-US",
};

export function intlLocale(locale: Locale): string {
  return INTL_LOCALES[locale];
}
