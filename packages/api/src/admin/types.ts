/**
 * Mirror của DTO trong OpenAPI spec (`/docs-json`, tag `admin`), KHÔNG suy từ
 * schema DB của backend. Ba endpoint duy nhất hiện có:
 * `GET /admin/stats`, `GET /admin/users`, `GET /admin/users/{id}`.
 *
 * ⚠️ Lệch đã biết giữa spec và shape thật (xem `docs/admin-plan.md` §1):
 * `displayName`, `avatarUrl`, `emailVerifiedAt`, `lastSeenAt`,
 * `usernameChangedAt` được spec khai `type: "object", nullable: true` — đó là
 * lỗi generate của Nest Swagger. Shape thật là `string | null`, và đó là thứ
 * chép ở đây. Cùng loại lệch với ghi chú đầu `chat/types.ts`.
 *
 * ⚠️ `AdminUserDto` **chưa có** `status`/`restrictions`: mô hình trạng thái tài
 * khoản ở `docs/admin-plan.md` §3b mới là contract đề xuất, backend chưa làm.
 * Đừng thêm vào đây trước khi spec có.
 */

import type { UserRole } from "../auth/types";

export type { UserRole };

/**
 * `AdminUserDto` — bản đầy đủ cho admin. KHÁC `User` (hồ sơ của chính mình) và
 * `PublicProfile` (hồ sơ người khác), đừng tái dùng hai kiểu kia cho bảng admin:
 * `User` không có `lastSeenAt`, `PublicProfile` không có `email`/`role`.
 */
export type AdminUser = {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  displayName: string | null;
  avatarUrl: string | null;
  /**
   * `null` = chưa verify email. Trạng thái `pending_verification` ở §3b **suy ra
   * từ trường này**, backend không lưu thành cột riêng.
   */
  emailVerifiedAt: string | null;
  /**
   * Lần cuối chuyển sang offline. **KHÔNG phải trạng thái online** — endpoint
   * admin không đọc presence (spec nói thẳng). Nhãn UI phải là "hoạt động lần
   * cuối", không phải dot xanh/xám.
   */
  lastSeenAt: string | null;
  /** `null` = chưa từng đổi username. */
  usernameChangedAt: string | null;
  createdAt: string;
};

/**
 * `AdminUserListDto` — phân trang **offset**, khác hẳn cursor của chat.
 * `page`/`limit` là echo lại query: dựng phân trang từ response thay vì tin vào
 * state của client.
 */
export type AdminUserList = {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
};

/** Query của `GET /admin/users`. `limit` tối đa **100** (ràng buộc backend). */
export type AdminUserListQuery = {
  page?: number;
  limit?: number;
  /** Khớp gần đúng trên email + username. */
  q?: string;
  role?: UserRole;
};

/**
 * `AdminStatsDto`. Spec ghi rõ backend **không cache**: số liệu tính lúc gọi,
 * nhưng cũng không phải realtime. UI đặt `staleTime` ngắn + nút refresh thay vì
 * vẽ như dashboard sống.
 *
 * ⚠️ `totalUsers` sẽ gồm cả tài khoản bị ban/suspend khi §3b có thật —
 * `suspendedUsers`/`bannedUsers` mới là đề xuất, chưa có trong spec.
 */
export type AdminStats = {
  totalUsers: number;
  verifiedUsers: number;
  newUsersLast7Days: number;
  admins: number;
};
