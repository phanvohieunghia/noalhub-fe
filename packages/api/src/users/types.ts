/**
 * Mirror của DTO trong OpenAPI spec (`/docs`, tag `users`).
 *
 * `UserDto` (hồ sơ của CHÍNH MÌNH) dùng chung với auth — re-export lại đây cho
 * component không phải nhớ nó nằm ở feature nào.
 */
export type { User, UserRole } from "../auth/types";

/**
 * `PublicProfileDto` — hồ sơ của người khác. Ít trường hơn `User` rất nhiều:
 * không có email, role, emailVerified. Đừng dùng `User` thay cho kiểu này.
 */
export type PublicProfile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  /** Ngày tham gia. */
  createdAt: string;
  /**
   * Lần cuối chuyển sang offline; `null` = chưa từng online. **Không** phải
   * trạng thái online hiện tại — endpoint này không tính presence, realtime
   * phải nghe `presence:changed` trên socket.
   */
  lastSeenAt: string | null;
};
