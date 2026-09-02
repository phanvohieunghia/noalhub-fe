/**
 * A mirror of the DTOs in the OpenAPI spec (`/docs`, tag `users`).
 *
 * `UserDto` (YOUR OWN profile) is shared with auth — re-exported here so
 * components need not remember which feature it lives in.
 */
export type { User, UserLanguage, UserRole } from "../auth/types";

/**
 * `PublicProfileDto` — someone else's profile. Far fewer fields than `User`: no
 * email, no role, no emailVerified. Do not substitute `User` for this type.
 */
export type PublicProfile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  /** The join date. */
  createdAt: string;
  /**
   * When they last went offline; `null` means never online. **Not** the current
   * online state — this endpoint does not compute presence; realtime requires
   * listening to `presence:changed` on the socket.
   */
  lastSeenAt: string | null;
};
