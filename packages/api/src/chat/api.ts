import { http } from "../client";
import {
  conversationPageSchema,
  conversationSchema,
  messagePageSchema,
} from "./schemas";
import type { Conversation, ConversationPage, MessagePage } from "./types";

/**
 * Chat's transport layer — READ ONLY.
 *
 * There is no `sendMessage` here: the backend deliberately offers exactly ONE
 * write path, the acknowledged socket event `message:send`
 * (`services/chat/socket.ts`). This is the only place the chat feature departs
 * from the `docs/data-layer.md` §3 template — deliberately.
 *
 * Paths carry no `/api` prefix: `services/config.ts` folded it into the
 * baseURL.
 */

/** GET /chat/conversations — the `before` cursor is a **date-time**. */
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
 * POST /chat/conversations/direct — **idempotent**: calling it ten times returns
 * the same one conversation (the backend prevents duplicates with a unique
 * index on `direct_key`). A 404 means no such user.
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
 * GET /chat/conversations/{id} — includes `members`.
 *
 * A 404 means "it does not exist OR you are not a member" — the backend
 * deliberately does not disclose which, and no endpoint here answers 403.
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
 * GET /chat/conversations/{id}/messages — the `before` cursor is a **uuid**
 * (unlike the conversation list endpoint, where it is a date-time).
 *
 * `items` is NEWEST FIRST; `nextCursor === null` means the history is
 * exhausted.
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
 * The HTTP counterpart of the `message:mark-read` socket event. It exists so
 * marking as read still works while the socket is offline.
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
