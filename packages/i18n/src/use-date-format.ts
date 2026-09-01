import { formatDate, formatDateTime } from "@noalhub/core/format-date";
import { useLocale } from "next-intl";

import { intlLocale } from "./formats";
import { DEFAULT_LOCALE, isLocale } from "./config";

/**
 * Hai hàm định dạng ngày đã gắn sẵn locale của request hiện tại.
 *
 * Chạy được ở **cả** Server lẫn Client Component — `useLocale()` của next-intl
 * có hai bản, và cả hai đều trả về locale đang render.
 *
 * Đây là đường **duy nhất** để định dạng ngày trong app: gọi thẳng
 * `formatDate(locale, value)` thì mỗi chỗ tự lo lấy locale, và chỗ nào quên là
 * ngày tháng ở đó vĩnh viễn tiếng Việt (`docs/i18n-plan.md` §7.1).
 */
export function useDateFormat() {
  const locale = useLocale();
  const tag = intlLocale(isLocale(locale) ? locale : DEFAULT_LOCALE);

  return {
    date: (value?: string | null) => formatDate(tag, value),
    dateTime: (value?: string | null) => formatDateTime(tag, value),
  };
}
