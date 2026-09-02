import type { Locale } from "./config";

/**
 * Shared formats, declared once for both apps. Passed to `formats` in
 * `getRequestConfig`, so `useFormatter().dateTime(d, "long")` renders the same
 * way everywhere.
 */
export const formats = {
  dateTime: {
    short: { dateStyle: "short" },
    long: { dateStyle: "long" },
    full: { dateStyle: "long", timeStyle: "short" },
  },
} as const;

/**
 * The BCP-47 tag handed to `Intl.*`. Plain `vi` works, but the region-qualified
 * tag gives the right day/month order and number group separators.
 */
const INTL_LOCALES: Record<Locale, string> = {
  vi: "vi-VN",
  en: "en-US",
};

export function intlLocale(locale: Locale): string {
  return INTL_LOCALES[locale];
}
