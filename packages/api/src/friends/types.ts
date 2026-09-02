/**
 * A mirror of the DTOs in the OpenAPI spec (`/docs`, tag `friends`).
 * A change here must come with a change to the zod schemas in `./schemas.ts`.
 */

import type { PublicProfile } from "../users/types";

/**
 * The relationship as seen from the CALLER's side — for one pair of users, each
 * side sees a different value. `pending_incoming` means they invited you and
 * you owe an answer.
 */
export type FriendState =
  | "none"
  | "pending_outgoing"
  | "pending_incoming"
  | "friends";

/** `FriendDto` — it wraps `PublicProfileDto` rather than flattening it. */
export type Friend = {
  user: PublicProfile;
  state: FriendState;
  /** When the current state began: the moment you became friends, or the request was sent. */
  since: string | null;
};

/** `FriendListDto` */
export type FriendList = {
  items: Friend[];
  total: number;
};

/** The query for `GET /friends/requests`. The backend defaults to `incoming`. */
export type FriendRequestDirection = "incoming" | "outgoing";
