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

export const tokenStore = {
  getAccess: (): string | null => accessToken,

  setAccess(token: string) {
    accessToken = token;
  },

  setTokens(tokens: AuthTokens) {
    console.log("settokens 1");
    accessToken = tokens.accessToken;
    if (typeof window !== "undefined") {
      console.log("settokens 2");

      localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    }
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
        callback();
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};
