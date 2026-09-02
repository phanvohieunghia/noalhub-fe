import { http } from "../client";
import { friendListSchema, friendSchema } from "./schemas";
import type { Friend, FriendList, FriendRequestDirection } from "./types";

/**
 * The contact surface with the friends backend, mapping 1-to-1 to the OpenAPI
 * spec (tag `friends`).
 *
 * Every endpoint identifies the other person by **username** in the path —
 * there are no ids here; the id is an internal key only.
 */

/** GET /friends → 200 FriendListDto. Most recently befriended first. */
export async function listFriends(signal?: AbortSignal): Promise<FriendList> {
  const { data } = await http.get<FriendList>("/friends", {
    authRequired: true,
    schema: friendListSchema,
    signal,
  });
  return data;
}

/** GET /friends/requests → 200 FriendListDto. The backend defaults to `incoming`. */
export async function listFriendRequests(
  direction: FriendRequestDirection = "incoming",
  signal?: AbortSignal,
): Promise<FriendList> {
  const { data } = await http.get<FriendList>("/friends/requests", {
    params: { direction },
    authRequired: true,
    schema: friendListSchema,
    signal,
  });
  return data;
}

/**
 * POST /friends/requests/{username} → 201 FriendDto.
 *
 * If the other person ALREADY invited you, this call accepts immediately and
 * returns `state = "friends"` — read the response's `state`, never assume
 * `pending_outgoing`.
 *
 * 400 CANNOT_FRIEND_SELF, 404 USER_NOT_FOUND,
 * 409 ALREADY_FRIENDS | FRIEND_REQUEST_EXISTS.
 */
export async function sendFriendRequest(username: string): Promise<Friend> {
  const { data } = await http.post<Friend>(
    `/friends/requests/${encodeURIComponent(username)}`,
    undefined,
    { authRequired: true, schema: friendSchema },
  );
  return data;
}

/**
 * POST /friends/requests/{username}/accept → 200 FriendDto.
 * Only the RECIPIENT may call it. 404 FRIEND_REQUEST_NOT_FOUND | USER_NOT_FOUND.
 */
export async function acceptFriendRequest(username: string): Promise<Friend> {
  const { data } = await http.post<Friend>(
    `/friends/requests/${encodeURIComponent(username)}/accept`,
    undefined,
    { authRequired: true, schema: friendSchema },
  );
  return data;
}

/**
 * DELETE /friends/requests/{username} → 204.
 *
 * One endpoint for BOTH directions: decline an incoming request, or cancel one
 * you sent. The server works out which side you are on.
 */
export async function removeFriendRequest(username: string): Promise<void> {
  await http.delete(`/friends/requests/${encodeURIComponent(username)}`, {
    authRequired: true,
  });
}

/** DELETE /friends/{username} → 204. Symmetric: the relationship ends on both sides. */
export async function unfriend(username: string): Promise<void> {
  await http.delete(`/friends/${encodeURIComponent(username)}`, {
    authRequired: true,
  });
}
