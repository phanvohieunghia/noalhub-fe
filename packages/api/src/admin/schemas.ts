import { z } from "zod";

/**
 * Response schema của feature admin — parse body REST để bắt backend đổi shape
 * ngay tại chỗ thay vì để lỗi trôi vào bảng.
 *
 * Mọi trường nullable dùng `.nullish().transform(...)` chứ không `.nullable()`:
 * spec khai chúng sai kiểu (xem `./types.ts`), nên trường có thể vắng mặt hẳn
 * thay vì bằng `null`. Cùng cách xử lý với `chat/schemas.ts`.
 */

const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? null);

export const adminUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
  role: z.enum(["user", "admin"]),
  displayName: nullableString,
  avatarUrl: nullableString,
  emailVerifiedAt: nullableString,
  lastSeenAt: nullableString,
  usernameChangedAt: nullableString,
  createdAt: z.string(),
});

/**
 * `page`/`limit` để `.catch()` chứ không bắt buộc: nếu backend chỉ trả
 * `items` + `total` thì phân trang vẫn dựng được từ query đã gửi, không đáng
 * để cả bảng vỡ vì thiếu hai số echo lại.
 */
export const adminUserListSchema = z.object({
  items: z.array(adminUserSchema),
  total: z.number(),
  page: z.number().catch(1),
  limit: z.number().catch(20),
});

export const adminStatsSchema = z.object({
  totalUsers: z.number(),
  verifiedUsers: z.number(),
  newUsersLast7Days: z.number(),
  admins: z.number(),
});

/**
 * Input schema của filter bảng user. Dùng để parse **URL searchParams** (nguồn
 * sự thật của filter, để link share được) — nên mọi trường đều optional và
 * `page`/`limit` phải coerce: searchParams luôn là chuỗi.
 *
 * `limit` max 100 để khớp DTO backend; lệch là backend trả `VALIDATION_FAILED`
 * sau khi UI đã coi là hợp lệ.
 */
export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
  q: z.string().trim().min(1).optional().catch(undefined),
  role: z.enum(["user", "admin"]).optional().catch(undefined),
});

export type AdminUserListQueryInput = z.infer<typeof adminUserListQuerySchema>;
