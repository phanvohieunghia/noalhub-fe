/**
 * Kiểu dữ liệu tầng chat — chép từ OpenAPI spec (`/docs-json`), KHÔNG suy từ
 * schema DB của backend. Hai thứ đó lệch nhau ở hai chỗ đã biết:
 *
 * - `MessageDto` KHÔNG có `deletedAt` dù bảng `messages` có cột đó.
 * - `ConversationDto` KHÔNG có `lastMessageAt` dù backend sort theo cột đó.
 *
 * Xem `docs/chat.md` §0 và §3.3.
 */

export type ConversationType = "direct" | "group";
export type MessageType = "text" | "system";

/** CHỈ tồn tại ở client — backend không bao giờ trả về trường này. */
export type MessageStatus = "sending" | "sent" | "failed";

/** `MessageDto`. Required: id, conversationId, type, body, createdAt. */
export type Message = {
  /** UUID v7 do CLIENT sinh — nền tảng idempotency, xem `docs/chat.md` §4. */
  id: string;
  conversationId: string;
  /** null khi người gửi đã bị xoá (`ON DELETE SET NULL` ở backend). */
  senderId: string | null;
  type: MessageType;
  body: string;
  /** Do server đặt. KHÔNG đọc timestamp từ `id` để hiển thị. */
  createdAt: string;
  /** Client-only: trạng thái gửi của tin mình vừa soạn. */
  status?: MessageStatus;
  /** Client-only: mã lỗi từ ack khi `status === "failed"`. */
  errorCode?: string;
};

/**
 * `ConversationMemberDto` — PHẲNG, không lồng `UserDto`. Đừng tái dùng `User`
 * của `services/auth/types.ts` cho chỗ này (thiếu email/emailVerified, và
 * không có joinedAt/leftAt).
 */
export type ConversationMember = {
  userId: string;
  role: "member" | "owner";
  displayName: string | null;
  avatarUrl: string | null;
  lastReadMessageId: string | null;
  /**
   * Ảnh chụp presence lúc trả response, sau đó cập nhật qua `presence:changed`.
   * `null` = endpoint không tính presence (danh sách hội thoại chỉ tính cho DM)
   * — KHÔNG phải offline.
   */
  status: PresenceStatus | null;
  /** Chỉ có ý nghĩa khi `status === "offline"`. */
  lastSeenAt: string | null;
};

/** `ConversationDto`. Required: id, type, unreadCount, members, createdAt. */
export type Conversation = {
  id: string;
  type: ConversationType;
  /** null với `direct` → tên hiển thị lấy từ thành viên còn lại. */
  title: string | null;
  lastMessage: Message | null;
  unreadCount: number;
  members: ConversationMember[];
  createdAt: string;
};

/** `ConversationPageDto`. `nextCursor` là **date-time**. */
export type ConversationPage = {
  items: Conversation[];
  nextCursor: string | null;
};

/**
 * `MessagePageDto`. `items` là **mới nhất trước**; `nextCursor` là **uuid**,
 * `null` nghĩa là đã hết lịch sử (điều kiện dừng, không phải lỗi).
 */
export type MessagePage = {
  items: Message[];
  nextCursor: string | null;
};

/** Trạng thái kết nối socket, cho `ConnectionBanner`. */
export type ChatConnectionStatus = "connecting" | "online" | "offline";

export type PresenceStatus = "online" | "offline";

export type PresenceEntry = {
  status: PresenceStatus;
  lastSeenAt: string | null;
};
