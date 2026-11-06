/**
 * Three modes, and `system` is a REAL choice rather than "nothing chosen yet":
 * it means *keep listening to* `prefers-color-scheme`, so the provider has to
 * hold a listener instead of reading once on mount.
 */
export type ThemeMode = 'light' | 'dark' | 'system' | 'auto'

/** The result of resolving `system` to a real theme — what decides the class on <html>. */
export type ResolvedTheme = 'light' | 'dark'

export const THEME_MODES: readonly ThemeMode[] = ['auto', 'light', 'dark', 'system']

/** The localStorage key. Duplicated as a literal in `script.ts` — see the note there. */
export const THEME_STORAGE_KEY = 'noalhub-theme'

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system' || value === 'auto'
}

/**
 * `auto` follows the device clock instead of the OS theme: light from 06:00 to
 * 17:59 local time, dark otherwise. Duplicated as literals in `script.ts`.
 */
export const AUTO_LIGHT_FROM_HOUR = 6
export const AUTO_DARK_FROM_HOUR = 18

export function isDaytime(date: Date = new Date()): boolean {
  const h = date.getHours()
  return h >= AUTO_LIGHT_FROM_HOUR && h < AUTO_DARK_FROM_HOUR
}
