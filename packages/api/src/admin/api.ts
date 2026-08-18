import { http } from "../client";
import {
  adminStatsSchema,
  adminUserListSchema,
  adminUserSchema,
} from "./schemas";
import type { AdminStats, AdminUser, AdminUserList, AdminUserListQuery } from "./types";

/**
 * Bề mặt tiếp xúc với backend admin, map 1-1 với OpenAPI spec (tag `admin`).
 *
 * Cả ba endpoint đều yêu cầu `role === "admin"` và đều khai **403** (không đủ
 * quyền) lẫn **429** `RATE_LIMITED`. Tầng này không xử lý chúng — component
 * đọc `ApiError.code` và quyết định hiển thị.
 */

/**
 * GET /admin/stats → 200 AdminStatsDto. 403, 429.
 *
 * Backend **không cache**; tần suất gọi do tầng hooks quyết định.
 */
export async function getAdminStats(signal?: AbortSignal): Promise<AdminStats> {
  const { data } = await http.get<AdminStats>("/admin/stats", {
    authRequired: true,
    schema: adminStatsSchema,
    signal,
  });
  return data;
}

/**
 * GET /admin/users → 200 AdminUserListDto. 403, 429.
 *
 * Phân trang offset. Trường rỗng bị loại khỏi query thay vì gửi `q=`: gửi chuỗi
 * rỗng là một filter khác với "không lọc", và nó cũng làm bẩn query key.
 */
export async function listAdminUsers(
  query: AdminUserListQuery = {},
  signal?: AbortSignal,
): Promise<AdminUserList> {
  const params: Record<string, string | number> = {};
  if (query.page !== undefined) params.page = query.page;
  if (query.limit !== undefined) params.limit = query.limit;
  if (query.q) params.q = query.q;
  if (query.role) params.role = query.role;

  const { data } = await http.get<AdminUserList>("/admin/users", {
    params,
    authRequired: true,
    schema: adminUserListSchema,
    signal,
  });
  return data;
}

/**
 * GET /admin/users/{id} → 200 AdminUserDto. 403, 404 USER_NOT_FOUND, 429.
 *
 * Tra theo **id**, không phải username — ngược với `GET /users/{username}` của
 * feature users. Bảng admin có sẵn id nên đó là khoá đúng ở đây.
 */
export async function getAdminUser(
  id: string,
  signal?: AbortSignal,
): Promise<AdminUser> {
  const { data } = await http.get<AdminUser>(
    `/admin/users/${encodeURIComponent(id)}`,
    { authRequired: true, schema: adminUserSchema, signal },
  );
  return data;
}
