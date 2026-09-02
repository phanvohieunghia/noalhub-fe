import { http } from "../client";
import { userSchema } from "../auth/schemas";
import { publicProfileSchema } from "./schemas";
import type { ChangeLanguageInput, ChangeUsernameInput } from "./schemas";
import type { PublicProfile, User } from "./types";

/**
 * The contact surface with the users backend, mapping 1-to-1 to the OpenAPI
 * spec (tag `users`).
 */

/**
 * GET /users/{username} → 200 PublicProfileDto. 404 USER_NOT_FOUND.
 *
 * Looked up by **username**, not id — the id is an internal key only.
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
 * Returns the updated user in the same shape as `/auth/me` → replace the cached copy directly.
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

/**
 * PATCH /users/me/language → 200 UserDto.
 *
 * No dedicated error code: a bad enum is a 400 VALIDATION_FAILED and being
 * signed out is a 401. Returns the updated user in the same shape as
 * `/auth/me` → replace the cached copy directly.
 */
export async function changeLanguage(input: ChangeLanguageInput): Promise<User> {
  const { data } = await http.patch<User>("/users/me/language", input, {
    authRequired: true,
    schema: userSchema,
  });
  return data;
}
