import { http } from "../client";
import { friendListSchema, friendSchema } from "./schemas";
import type { Friend, FriendList, FriendRequestDirection } from "./types";

/**
 * Bề mặt tiếp xúc với backend friends, map 1-1 với OpenAPI spec (tag `friends`).
 *
 * Mọi endpoint định danh người kia bằng **username** trên path — không có id ở
 * đây, id chỉ là khoá nội bộ.
 */

/** GET /friends → 200 FriendListDto. Mới kết bạn trước. */
export async function listFriends(signal?: AbortSignal): Promise<FriendList> {
  const { data } = await http.get<FriendList>("/friends", {
    authRequired: true,
    schema: friendListSchema,
    signal,
  });
  return data;
}

/** GET /friends/requests → 200 FriendListDto. Mặc định backend là `incoming`. */
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
 * Nếu người kia ĐANG mời mình thì lời gọi này chấp nhận luôn và trả về
 * `state = "friends"` — đọc `state` của response, đừng giả định `pending_outgoing`.
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
 * Chỉ bên NHẬN gọi được. 404 FRIEND_REQUEST_NOT_FOUND | USER_NOT_FOUND.
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
 * Một endpoint cho CẢ HAI chiều: từ chối lời mời đến, hoặc huỷ lời mời đã gửi.
 * Server tự biết mình là bên nào.
 */
export async function removeFriendRequest(username: string): Promise<void> {
  await http.delete(`/friends/requests/${encodeURIComponent(username)}`, {
    authRequired: true,
  });
}

/** DELETE /friends/{username} → 204. Đối xứng: mất quan hệ ở cả hai phía. */
export async function unfriend(username: string): Promise<void> {
  await http.delete(`/friends/${encodeURIComponent(username)}`, {
    authRequired: true,
  });
}
