import { http } from "../client";
import { userSchema } from "../auth/schemas";
import { publicProfileSchema } from "./schemas";
import type { ChangeUsernameInput } from "./schemas";
import type { PublicProfile, User } from "./types";

/**
 * Bề mặt tiếp xúc với backend users, map 1-1 với OpenAPI spec (tag `users`).
 */

/**
 * GET /users/{username} → 200 PublicProfileDto. 404 USER_NOT_FOUND.
 *
 * Tra theo **username**, không phải id — id chỉ là khoá nội bộ.
 */
export async function getPublicProfile(
  username: string,
  signal?: AbortSignal,
): Promise<PublicProfile> {
  const { data } = await http.get<PublicProfile>(
    `/users/${encodeURIComponent(username)}`,
    { authRequired: true, schema: publicProfileSchema, signal },
  );
  return data;
}

/**
 * PATCH /users/me/username → 200 UserDto.
 *
 * 403 USERNAME_CHANGE_TOO_SOON, 409 USERNAME_TAKEN, 429 RATE_LIMITED.
 * Trả về user sau khi đổi, cùng shape `/auth/me` → thay thẳng bản cache.
 */
export async function changeUsername(
  input: ChangeUsernameInput,
): Promise<User> {
  const { data } = await http.patch<User>("/users/me/username", input, {
    authRequired: true,
    schema: userSchema,
  });
  return data;
}
