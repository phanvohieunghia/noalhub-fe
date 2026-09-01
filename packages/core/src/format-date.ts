/**
 * Định dạng ngày/giờ theo locale.
 *
 * Trước i18n, hai formatter được tạo một lần ở module scope với `vi-VN` cứng.
 * Giờ locale chỉ biết được lúc chạy nên phải tạo theo yêu cầu — nhưng vẫn
 * **cache**: `new Intl.DateTimeFormat` là một trong những hàm đắt nhất của
 * `Intl`, và danh sách chat gọi nó cho từng dòng ở mỗi lần render.
 *
 * Component không gọi thẳng hai hàm này mà dùng `useDateFormat()` của
 * `@noalhub/i18n` — nó gắn sẵn locale hiện tại, không chỗ nào phải tự truyền.
 */

type Style = "date" | "dateTime";

const OPTIONS: Record<Style, Intl.DateTimeFormatOptions> = {
  date: { dateStyle: "long" },
  dateTime: { dateStyle: "long", timeStyle: "short" },
};

const cache = new Map<string, Intl.DateTimeFormat>();

function formatter(locale: string, style: Style): Intl.DateTimeFormat {
  const key = `${locale}:${style}`;
  let found = cache.get(key);
  if (!found) {
    found = new Intl.DateTimeFormat(locale, OPTIONS[style]);
    cache.set(key, found);
  }
  return found;
}

/** Backend trả ISO string; giá trị null/không parse được thì hiện "—". */
export function formatDate(locale: string, value?: string | null): string {
  return format(formatter(locale, "date"), value);
}

export function formatDateTime(locale: string, value?: string | null): string {
  return format(formatter(locale, "dateTime"), value);
}

function format(formatter: Intl.DateTimeFormat, value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : formatter.format(date);
}
