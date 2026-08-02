import { http } from "../client";
import {
  conversationPageSchema,
  conversationSchema,
  messagePageSchema,
} from "./schemas";
import type { Conversation, ConversationPage, MessagePage } from "./types";

/**
 * Tầng transport của chat — CHỈ ĐỌC.
 *
 * Không có `sendMessage` ở đây: backend cố tình chỉ có MỘT đường ghi, là socket
 * event `message:send` có ack (`services/chat/socket.ts`). Đây là chỗ duy nhất
 * feature chat lệch khỏi template `docs/data-layer.md` §3 — cố ý.
 *
 * Path không mang tiền tố `/api`: `services/config.ts` đã gộp vào baseURL.
 */

/** GET /chat/conversations — cursor `before` là **date-time**. */
export async function listConversations(
  params: { before?: string; limit?: number } = {},
  signal?: AbortSignal,
): Promise<ConversationPage> {
  const { data } = await http.get<ConversationPage>("/chat/conversations", {
    params,
    authRequired: true,
    schema: conversationPageSchema,
    signal,
  });
  return data;
}

/**
 * POST /chat/conversations/direct — **idempotent**: gọi mười lần trả về đúng
 * một hội thoại (backend chặn trùng bằng unique index trên `direct_key`).
 * 404 = không có user đó.
 */
export async function createDirectConversation(
  userId: string,
): Promise<Conversation> {
  const { data } = await http.post<Conversation>(
    "/chat/conversations/direct",
    { userId },
    { authRequired: true, schema: conversationSchema },
  );
  return data;
}

/**
 * GET /chat/conversations/{id} — kèm `members`.
 *
 * 404 nghĩa là "không tồn tại HOẶC bạn không phải thành viên" — backend cố ý
 * không tiết lộ, và không endpoint nào trả 403.
 */
export async function getConversation(
  id: string,
  signal?: AbortSignal,
): Promise<Conversation> {
  const { data } = await http.get<Conversation>(`/chat/conversations/${id}`, {
    authRequired: true,
    schema: conversationSchema,
    signal,
  });
  return data;
}

/**
 * GET /chat/conversations/{id}/messages — cursor `before` là **uuid** (khác
 * endpoint danh sách hội thoại, chỗ đó là date-time).
 *
 * `items` là MỚI NHẤT TRƯỚC; `nextCursor === null` là đã hết lịch sử.
 */
export async function listMessages(
  conversationId: string,
  params: { before?: string; limit?: number } = {},
  signal?: AbortSignal,
): Promise<MessagePage> {
  const { data } = await http.get<MessagePage>(
    `/chat/conversations/${conversationId}/messages`,
    {
      params,
      authRequired: true,
      schema: messagePageSchema,
      signal,
    },
  );
  return data;
}

/**
 * POST /chat/conversations/{id}/read → 204.
 *
 * Bản HTTP của socket event `message:mark-read`. Tồn tại để đánh dấu đã đọc
 * vẫn chạy khi socket offline.
 */
export async function markRead(
  conversationId: string,
  messageId: string,
): Promise<void> {
  await http.post(
    `/chat/conversations/${conversationId}/read`,
    { messageId },
    { authRequired: true },
  );
}
