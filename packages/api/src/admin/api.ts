import { http } from "../client";
import {
  adminStatsSchema,
  adminUserListSchema,
  adminUserSchema,
  storybookAccessSchema,
} from "./schemas";
import { z } from "zod";
import type {
  AdminStats,
  AdminUser,
  AdminUserList,
  AdminUserListQuery,
  GrantStorybookAccessInput,
  StorybookAccess,
} from "./types";

/**
 * The contact surface with the admin backend, mapping 1-to-1 to the OpenAPI
 * spec (tag `admin`).
 *
 * All three endpoints require `role === "admin"` and all declare both **403**
 * (insufficient permission) and **429** `RATE_LIMITED`. This layer does not
 * handle them — components read `ApiError.code` and decide what to show.
 */

/**
 * GET /admin/stats → 200 AdminStatsDto. 403, 429.
 *
 * The backend does **not** cache; call frequency is the hooks layer's decision.
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
 * Offset pagination. Empty fields are dropped from the query rather than sent
 * as `q=`: an empty string is a different filter from "no filter", and it also
 * pollutes the query key.
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
 * Looked up by **id**, not username — the opposite of the users feature's
 * `GET /users/{username}`. The admin table already holds ids, so that is the
 * right key here.
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

/**
 * GET /admin/storybook-access → 200 `StorybookAccessDto[]`.
 *
 * A plain array, **not** a paginated envelope — unlike every other admin list
 * here. That is the backend's shape and it fits: this list is a handful of
 * people, and paginating it would hide the one row you came to revoke.
 */
export async function listStorybookAccess(
  signal?: AbortSignal,
): Promise<StorybookAccess[]> {
  const { data } = await http.get<StorybookAccess[]>("/admin/storybook-access", {
    authRequired: true,
    schema: z.array(storybookAccessSchema),
    signal,
  });
  return data;
}

/**
 * POST /admin/storybook-access → 201. 409 `STORYBOOK_ACCESS_CONFLICT` when the
 * email is already on the list.
 *
 * `note` is dropped when empty rather than sent as `""`: the field is optional
 * in the DTO, and an empty string would store a note that renders as a blank
 * cell instead of the "—" an absent note gets.
 */
export async function grantStorybookAccess(
  input: GrantStorybookAccessInput,
): Promise<StorybookAccess> {
  const body: GrantStorybookAccessInput = { email: input.email };
  if (input.note) body.note = input.note;

  const { data } = await http.post<StorybookAccess>(
    "/admin/storybook-access",
    body,
    { authRequired: true, schema: storybookAccessSchema },
  );
  return data;
}

/**
 * DELETE /admin/storybook-access/{id} → 204. 404 `STORYBOOK_ACCESS_NOT_FOUND`.
 *
 * A **hard** delete, unlike `archiveBlogPost`: there is nothing to keep, and the
 * effect is immediate — the person's open session is refused on its next request
 * rather than at cookie expiry.
 */
export async function revokeStorybookAccess(id: string): Promise<void> {
  await http.delete(`/admin/storybook-access/${encodeURIComponent(id)}`, {
    authRequired: true,
  });
}
