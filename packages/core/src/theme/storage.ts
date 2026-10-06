import { isThemeMode, THEME_STORAGE_KEY, type ThemeMode } from "./types";

/**
 * Every touch of `localStorage` must be wrapped in `try/catch`: Safari in a
 * private window, and browsers with cookies blocked, **throw on property
 * access** rather than returning `null`. Uncaught, that takes the whole React
 * tree down with it.
 */
export function readThemeMode(storage?: { getItem(key: string): string | null }): ThemeMode {
  try {
    const raw = storage
      ? storage.getItem(THEME_STORAGE_KEY)
      : typeof window !== "undefined"
        ? localStorage.getItem(THEME_STORAGE_KEY)
        : null;
    return isThemeMode(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

export function writeThemeMode(
  mode: ThemeMode,
  storage?: { setItem(key: string, value: string): void },
): void {
  try {
    if (storage) {
      storage.setItem(THEME_STORAGE_KEY, mode);
    } else if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  } catch {
    // If it cannot be stored, the theme lives for this session only — still
    // usable, just lost on reload. Nothing worth telling the user about.
  }
}
