"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { readThemeMode, writeThemeMode } from "@noalhub/core/theme/storage";
import type { ResolvedTheme, ThemeMode } from "@noalhub/core/theme/types";

type ThemeContextValue = {
  mode: ThemeMode;
  /** `system` already resolved to a real theme. For drawing icons, not for deciding the class. */
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  /** false until the first effect runs — see `theme-toggle.tsx`. */
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DARK_QUERY = "(prefers-color-scheme: dark)";

function applyClass(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  // Tells the browser's native controls (scrollbar, date picker, autofill) that
  // the background is dark. Without this line the scrollbar stays white.
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

/**
 * The source of truth is `localStorage`; the class on `<html>` is only a
 * consequence.
 *
 * The first paint is **not** the provider's decision — `THEME_INIT_SCRIPT` in
 * the `<head>` sets the class before React runs. The provider takes over from
 * the user's first click onwards, and syncs its state to match what the script
 * already did.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The server cannot read localStorage, so this starts from a static value and
  // is corrected in an effect. That is precisely why `mounted` exists.
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [systemDark, setSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    setModeState(readThemeMode());
    setSystemDark(media.matches);
    setMounted(true);

    // In `system` mode, changing the OS theme with the tab open must change the
    // page immediately — reading once on mount is not enough.
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolved: ResolvedTheme =
    mode === "system" ? (systemDark ? "dark" : "light") : mode;

  useEffect(() => {
    if (mounted) applyClass(resolved === "dark");
  }, [mounted, resolved]);

  const setMode = useCallback((next: ThemeMode) => {
    writeThemeMode(next);
    setModeState(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
