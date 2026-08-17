/**
 * Mirror của DTO trong OpenAPI spec (`/docs`, tag `friends`).
 * Đổi ở đây phải kèm đổi zod schema trong `./schemas.ts`.
 */

import type { PublicProfile } from "../users/types";

/**
 * Quan hệ nhìn từ phía NGƯỜI GỌI — cùng một cặp user, hai phía thấy hai giá
 * trị khác nhau. `pending_incoming` = họ mời mình, cần mình trả lời.
 */
export type FriendState =
  | "none"
  | "pending_outgoing"
  | "pending_incoming"
  | "friends";

/** `FriendDto` — bọc `PublicProfileDto` chứ không phẳng. */
export type Friend = {
  user: PublicProfile;
  state: FriendState;
  /** Mốc bắt đầu của trạng thái hiện tại: lúc kết bạn, hoặc lúc gửi lời mời. */
  since: string | null;
};

/** `FriendListDto` */
export type FriendList = {
  items: Friend[];
  total: number;
};

/** Query của `GET /friends/requests`. Mặc định của backend là `incoming`. */
export type FriendRequestDirection = "incoming" | "outgoing";
