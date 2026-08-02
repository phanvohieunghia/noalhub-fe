import type { AuthTokens } from "@/services/auth/types";

/**
 * BIÊN CÔ LẬP — file duy nhất trong codebase được phép chạm localStorage.
 *
 * Access token nằm trong biến module (memory): mất khi reload, nhưng XSS kiểu
 * "đọc storage" không lấy được nó. Refresh token buộc phải sống qua reload nên
 * nằm ở localStorage.
 *
 * Muốn chuyển sang httpOnly cookie + BFF sau này: viết lại đúng file này,
 * không component nào phải sửa.
 */

const REFRESH_KEY = "nh.refresh";

let accessToken: string | null = null;

/**
 * Người nghe access token đổi. Tầng socket cần biết để emit `auth:refresh` —
 * kết nối socket sống lâu hơn access token (TTL 15 phút), nếu không gia hạn
 * thì backend ngắt kèm mã TOKEN_EXPIRED.
 */
const accessListeners = new Set<(token: string | null) => void>();

function notify() {
  for (const listener of accessListeners) {
    // Một listener ném lỗi không được phép chặn các listener còn lại.
    try {
      listener(accessToken);
    } catch {
      /* bỏ qua */
    }
  }
}

export const tokenStore = {
  getAccess: (): string | null => accessToken,

  setAccess(token: string) {
    accessToken = token;
    notify();
  },

  setTokens(tokens: AuthTokens) {
    accessToken = tokens.accessToken;
    if (typeof window !== "undefined") {
      localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    }
    notify();
  },

  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_KEY);
  },

  clear() {
    accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(REFRESH_KEY);
    }
    notify();
  },

  /**
   * Đăng ký nghe access token đổi. Trả về hàm huỷ đăng ký.
   *
   * Callback nhận token MỚI, kể cả `null` (lúc clear) — bên nghe tự quyết định
   * làm gì với null, đừng lọc sẵn ở đây.
   */
  subscribe(callback: (token: string | null) => void): () => void {
    accessListeners.add(callback);
    return () => accessListeners.delete(callback);
  },

  /**
   * Đồng bộ đa tab: tab khác xoá refresh token (logout) → tab này cũng phải
   * thoát. Trả về hàm huỷ đăng ký.
   */
  onExternalClear(callback: () => void): () => void {
    if (typeof window === "undefined") return () => {};

    const handler = (event: StorageEvent) => {
      // event.key === null nghĩa là localStorage.clear()
      if (event.key !== null && event.key !== REFRESH_KEY) return;
      if (event.newValue === null) {
        accessToken = null;
        notify();
        callback();
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};
