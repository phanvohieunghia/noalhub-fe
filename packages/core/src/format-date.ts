/**
 * Locale-aware date/time formatting.
 *
 * Before i18n, both formatters were created once at module scope with a
 * hardcoded `vi-VN`. The locale is only known at runtime now, so they are built
 * on demand — but still **cached**: `new Intl.DateTimeFormat` is one of the
 * most expensive things in `Intl`, and the chat list calls it per row on every
 * render.
 *
 * Components do not call these two directly; they use `useDateFormat()` from
 * `@noalhub/i18n`, which binds the current locale so no call site has to pass
 * it.
 */

type Style = "date" | "dateTime" | "dayMonth" | "monthYear";

const OPTIONS: Record<Style, Intl.DateTimeFormatOptions> = {
  date: { dateStyle: "long" },
  dateTime: { dateStyle: "long", timeStyle: "short" },
  /** Chart axis ticks: "16/10" / "10/16" — no year, the axis already implies it. */
  dayMonth: { day: "numeric", month: "numeric" },
  /** Chart axis ticks for monthly buckets: "thg 10 2026" / "Oct 2026". */
  monthYear: { month: "short", year: "numeric" },
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

/** The backend returns ISO strings; null or unparsable values render as "—". */
export function formatDate(locale: string, value?: string | null): string {
  return format(formatter(locale, "date"), value);
}

export function formatDateTime(locale: string, value?: string | null): string {
  return format(formatter(locale, "dateTime"), value);
}

export function formatDayMonth(locale: string, value?: string | null): string {
  return format(formatter(locale, "dayMonth"), value);
}

export function formatMonthYear(locale: string, value?: string | null): string {
  return format(formatter(locale, "monthYear"), value);
}

function format(formatter: Intl.DateTimeFormat, value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : formatter.format(date);
}
