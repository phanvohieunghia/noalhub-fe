export const DEFAULT_REDIRECT = "/chat";

/**
 * Chỉ chấp nhận đường dẫn nội bộ. Không có hàm này thì
 * `/login?next=https://evil.com` trở thành lỗ hổng open-redirect.
 */
export function safeRedirect(
  next: string | null | undefined,
  /**
   * Đích khi `next` vắng hoặc không an toàn. `DEFAULT_REDIRECT` là route của
   * `apps/web`; `apps/admin` truyền đích của nó vào đây thay vì tự viết lại
   * phần kiểm tra open-redirect.
   */
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  // `//evil.com` và `/\evil.com` đều bị trình duyệt hiểu là protocol-relative.
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/**
 * Luồng OAuth đi qua provider rồi quay về callback do BACKEND cấu hình —
 * spec không nhận `redirect_uri`, nên không thể mang `next` theo query string.
 * Gửi tạm qua sessionStorage: sống đúng trong tab đang bắt tay, tự mất khi
 * đóng tab.
 */
const OAUTH_NEXT_KEY = "nh.oauth.next";

export function rememberOAuthNext(next: string | undefined) {
  if (typeof window === "undefined" || !next) return;
  sessionStorage.setItem(OAUTH_NEXT_KEY, safeRedirect(next));
}

export function takeOAuthNext(): string {
  if (typeof window === "undefined") return DEFAULT_REDIRECT;
  const next = sessionStorage.getItem(OAUTH_NEXT_KEY);
  sessionStorage.removeItem(OAUTH_NEXT_KEY);
  return safeRedirect(next);
}
