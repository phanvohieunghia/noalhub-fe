import { isThemeMode, THEME_STORAGE_KEY, type ThemeMode } from "./types";

/**
 * Mọi lần chạm `localStorage` đều phải bọc `try/catch`: Safari ở cửa sổ riêng
 * tư và trình duyệt chặn cookie **ném lỗi ngay lúc truy cập thuộc tính**, chứ
 * không phải trả về `null`. Không bắt thì cả cây React chết theo.
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
    // Không lưu được thì theme chỉ sống trong phiên này — vẫn dùng được, chỉ
    // là mất sau khi reload. Không có gì để báo cho user.
  }
}
