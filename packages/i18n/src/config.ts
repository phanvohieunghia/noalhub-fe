/**
 * i18n constants shared by **both apps**. This file imports nothing from
 * `next-intl` so it can load anywhere: the proxy (edge), server components,
 * client components, and `scripts/check-messages.mjs`.
 *
 * See `docs/i18n.md`.
 */

export const LOCALES = ["vi", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * The language used when there is no other signal. Must match the backend's
 * `DEFAULT_USER_LANGUAGE` (`src/users/language.ts`) — if they drift, a new user
 * gets one language in the UI and another in `user.language` right after
 * signing up.
 */
export const DEFAULT_LOCALE: Locale = "vi";

/**
 * The buffer that lets SSR know the language **before** calling `/auth/me`. The
 * source of truth is still `user.language` on the backend; the cookie merely
 * runs one beat ahead.
 *
 * NOT `HttpOnly`: `LanguageSwitcher` has to read and write it from the client,
 * otherwise every language change has to round-trip through the server and the
 * UI flashes.
 */
export const LOCALE_COOKIE = "NOALHUB_LOCALE";

/** One year. Anything shorter loses the choice for a user returning from a holiday. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

/**
 * Pick the closest locale from `Accept-Language`. Only for first-time visitors —
 * anyone with a cookie or a session never reaches this.
 *
 * Matched on the language prefix (`en-US` → `en`), ignoring `q=`: with exactly
 * two languages the order of appearance is enough, and pulling a negotiator
 * library into the edge bundle just to sort two items is not worth it.
 */
export function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase();
    const base = tag?.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}
