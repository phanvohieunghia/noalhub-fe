const DATE = new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" });
const DATE_TIME = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "long",
  timeStyle: "short",
});

/** Backend trả ISO string; giá trị null/không parse được thì hiện "—". */
export function formatDate(value?: string | null): string {
  return format(DATE, value);
}

export function formatDateTime(value?: string | null): string {
  return format(DATE_TIME, value);
}

function format(formatter: Intl.DateTimeFormat, value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : formatter.format(date);
}
