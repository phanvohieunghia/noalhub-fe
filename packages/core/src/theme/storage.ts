import { isThemeMode, THEME_STORAGE_KEY, type ThemeMode } from "./types";

/**
 * Every touch of `localStorage` must be wrapped in `try/catch`: Safari in a
 * private window, and browsers with cookies blocked, **throw on property
 * access** rather than returning `null`. Uncaught, that takes the whole React
 * tree down with it.
 */
export function readThemeMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

export function writeThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // If it cannot be stored, the theme lives for this session only — still
    // usable, just lost on reload. Nothing worth telling the user about.
  }
}
