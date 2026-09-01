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
  /** `system` đã được quy về màu thật. Dùng để vẽ icon, không để quyết định class. */
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  /** false cho tới khi hiệu ứng đầu tiên chạy — xem `theme-toggle.tsx`. */
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DARK_QUERY = "(prefers-color-scheme: dark)";

function applyClass(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  // Cho form control gốc của trình duyệt (scrollbar, date picker, autofill)
  // biết nền đang tối. Thiếu dòng này thì scrollbar vẫn sáng trắng.
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

/**
 * Nguồn sự thật là `localStorage`; class trên `<html>` chỉ là hệ quả.
 *
 * Lần vẽ đầu **không** do provider quyết định — `THEME_INIT_SCRIPT` trong
 * `<head>` đã set class trước khi React chạy. Provider chỉ tiếp quản từ lần
 * user bấm đổi trở đi, và đồng bộ lại state cho khớp với thứ script đã làm.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Server không đọc được localStorage nên phải khởi tạo bằng một giá trị
  // tĩnh, rồi sửa lại ở effect. Đây chính là lý do cần `mounted`.
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [systemDark, setSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    setModeState(readThemeMode());
    setSystemDark(media.matches);
    setMounted(true);

    // Ở chế độ `system`, user đổi theme máy lúc tab đang mở thì trang phải đổi
    // theo ngay — đọc một lần lúc mount là không đủ.
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
  if (!ctx) throw new Error("useTheme phải nằm trong <ThemeProvider>");
  return ctx;
}
