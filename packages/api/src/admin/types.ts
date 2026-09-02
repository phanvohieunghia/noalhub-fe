/**
 * A mirror of the DTOs in the OpenAPI spec (`/docs-json`, tag `admin`), NOT
 * inferred from the backend's DB schema. The only three endpoints today:
 * `GET /admin/stats`, `GET /admin/users`, `GET /admin/users/{id}`.
 *
 * ⚠️ Known drift between the spec and the real shape (see
 * `docs/admin-plan.md` §1): `displayName`, `avatarUrl`, `emailVerifiedAt`,
 * `lastSeenAt` and `usernameChangedAt` are declared as
 * `type: "object", nullable: true` — a Nest Swagger generation bug. The real
 * shape is `string | null`, which is what is written here. Same class of drift
 * as the note at the top of `chat/types.ts`.
 *
 * ⚠️ `AdminUserDto` does **not yet** have `status`/`restrictions`: the account
 * state model in `docs/admin-plan.md` §3b is a proposed contract the backend
 * has not built. Do not add them here before the spec does.
 */

import type { UserRole } from "../auth/types";

export type { UserRole };

/**
 * `AdminUserDto` — the full record for admins. DIFFERENT from `User` (your own
 * profile) and `PublicProfile` (someone else's); do not reuse either for the
 * admin table: `User` has no `lastSeenAt`, `PublicProfile` has no
 * `email`/`role`.
 */
export type AdminUser = {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  displayName: string | null;
  avatarUrl: string | null;
  /**
   * `null` means the email is unverified. The `pending_verification` state in
   * §3b is **derived from this field**; the backend stores no separate column.
   */
  emailVerifiedAt: string | null;
  /**
   * When they last went offline. **NOT an online state** — the admin endpoints
   * do not read presence (the spec says so outright). The UI label must be
   * "last active", never a green/gray dot.
   */
  lastSeenAt: string | null;
  /** `null` means the username has never been changed. */
  usernameChangedAt: string | null;
  createdAt: string;
};

/**
 * `AdminUserListDto` — **offset** pagination, quite unlike chat's cursor.
 * `page`/`limit` echo the query back: build the pagination from the response
 * rather than trusting client state.
 */
export type AdminUserList = {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
};

/** The query for `GET /admin/users`. `limit` maxes at **100** (a backend constraint). */
export type AdminUserListQuery = {
  page?: number;
  limit?: number;
  /** Fuzzy match across email + username. */
  q?: string;
  role?: UserRole;
};

/**
 * `AdminStatsDto`. The spec states the backend does **not** cache: the figures
 * are computed per call, but they are not realtime either. The UI uses a short
 * `staleTime` plus a refresh button rather than drawing a live dashboard.
 *
 * ⚠️ `totalUsers` will include banned/suspended accounts once §3b is real —
 * `suspendedUsers`/`bannedUsers` are proposals not present in the spec.
 */
export type AdminStats = {
  totalUsers: number;
  verifiedUsers: number;
  newUsersLast7Days: number;
  admins: number;
};
