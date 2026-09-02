/**
 * Three modes, and `system` is a REAL choice rather than "nothing chosen yet":
 * it means *keep listening to* `prefers-color-scheme`, so the provider has to
 * hold a listener instead of reading once on mount.
 */
export type ThemeMode = "light" | "dark" | "system";

/** The result of resolving `system` to a real theme — what decides the class on <html>. */
export type ResolvedTheme = "light" | "dark";

export const THEME_MODES: readonly ThemeMode[] = ["light", "dark", "system"];

/** The localStorage key. Duplicated as a literal in `script.ts` — see the note there. */
export const THEME_STORAGE_KEY = "noalhub-theme";

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}
