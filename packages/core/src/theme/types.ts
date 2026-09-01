/**
 * Ba chế độ, và `system` là một lựa chọn THẬT chứ không phải "chưa chọn gì":
 * nó có nghĩa *tiếp tục lắng nghe* `prefers-color-scheme`, nên provider phải
 * giữ listener chứ không chỉ đọc một lần lúc mount.
 */
export type ThemeMode = "light" | "dark" | "system";

/** Kết quả sau khi quy `system` về màu thật — thứ quyết định class trên <html>. */
export type ResolvedTheme = "light" | "dark";

export const THEME_MODES: readonly ThemeMode[] = ["light", "dark", "system"];

/** Key của localStorage. Trùng với hằng số cứng trong `script.ts` — xem chú thích ở đó. */
export const THEME_STORAGE_KEY = "noalhub-theme";

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}
