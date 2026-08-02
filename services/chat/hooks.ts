"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v7 as uuidv7 } from "uuid";

import * as chatApi from "./api";
import {
  connectChatSocket,
  disconnectChatSocket,
  emitFireAndForget,
  emitWithAck,
  getSocket,
} from "./socket";
import {
  conversationUpdatedEventSchema,
  messageNewEventSchema,
  messageReadEventSchema,
  presenceChangedEventSchema,
  sendMessageAckSchema,
  typingEventSchema,
} from "./schemas";
import type {
  ChatConnectionStatus,
  Conversation,
  ConversationMember,
  ConversationPage,
  Message,
  MessagePage,
} from "./types";
import { useEphemeralStore } from "@/lib/chat/ephemeral-store";
import { outbox } from "@/lib/chat/outbox";
import { useAuthStore } from "@/lib/auth/store";

/** Nguồn sự thật DUY NHẤT cho query key của feature. */
export const chatKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatKeys.all, "conversations"] as const,
  conversation: (id: string) => [...chatKeys.conversations(), id] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, "messages", conversationId] as const,
};

/* ------------------------------------------------------------------ queries */

/**
 * Mồi `presenceByUser` từ snapshot REST.
 *
 * Không có bước này thì store rỗng cho tới lúc ai đó ĐỔI trạng thái — mở hội
 * thoại với người đang online vẫn hiện "không rõ", vì `presence:changed` chỉ
 * bắn khi có thay đổi. `status: null` nghĩa là endpoint không tính presence
 * (spec: danh sách hội thoại chỉ tính cho DM) → bỏ qua, đừng ghi "offline" đè.
 */
function useSeedPresence(members: ConversationMember[] | undefined) {
  const setPresence = useEphemeralStore((state) => state.setPresence);

  useEffect(() => {
    if (!members) return;
    for (const member of members) {
      if (member.status) {
        setPresence(member.userId, member.status, member.lastSeenAt);
      }
    }
  }, [members, setPresence]);
}

export function useConversations() {
  const query = useInfiniteQuery({
    queryKey: chatKeys.conversations(),
    queryFn: ({ pageParam, signal }) =>
      chatApi.listConversations(
        { before: pageParam ?? undefined, limit: 20 },
        signal,
      ),
    initialPageParam: null as string | null,
    // Cursor của endpoint này là DATE-TIME (khác endpoint messages, chỗ đó là
    // uuid). Luôn đọc từ `nextCursor`, đừng tự suy từ `items`.
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const members = useMemo(
    () => query.data?.pages.flatMap((page) => page.items.flatMap((c) => c.members)),
    [query.data],
  );
  useSeedPresence(members);

  return query;
}

export function useConversation(id: string | undefined) {
  const query = useQuery({
    queryKey: chatKeys.conversation(id ?? ""),
    queryFn: ({ signal }) => chatApi.getConversation(id!, signal),
    enabled: Boolean(id),
  });

  useSeedPresence(query.data?.members);

  return query;
}

export function useMessages(conversationId: string | undefined) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId ?? ""),
    queryFn: ({ pageParam, signal }) =>
      chatApi.listMessages(
        conversationId!,
        { before: pageParam ?? undefined, limit: 50 },
        signal,
      ),
    initialPageParam: null as string | null,
    // Cursor là UUID. `null` = đã hết lịch sử — điều kiện dừng, không phải lỗi.
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(conversationId),
  });
}

/* ---------------------------------------------------------------- mutations */

export function useCreateDirectConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => chatApi.createDirectConversation(userId),
    onSuccess: (conversation) => {
      queryClient.setQueryData(
        chatKeys.conversation(conversation.id),
        conversation,
      );
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

export type SendMessageVariables = {
  /** Truyền lại `id` cũ khi gửi lại — ĐỪNG sinh id mới, sẽ phá idempotency. */
  id?: string;
  body: string;
};

/** Variables sau khi chuẩn hoá: `id` LUÔN có. */
type ResolvedSendMessageVariables = {
  id: string;
  body: string;
};

/**
 * Gửi tin: optimistic + ack qua socket.
 *
 * Backend chỉ có MỘT đường ghi là socket event, nên hook này không gọi REST.
 * Lỗi thì KHÔNG rollback — giữ bubble với `status: "failed"` kèm nút gửi lại,
 * vì xoá thứ người dùng vừa gõ là làm mất công của họ (`docs/chat.md` §5.5).
 */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

  const mutation = useMutation({
    mutationFn: async ({ id, body }: ResolvedSendMessageVariables) => {
      const raw = await emitWithAck<unknown>("message:send", {
        id,
        conversationId,
        body,
      });
      const ack = sendMessageAckSchema.parse(raw);
      if (!ack.ok) {
        throw new SendMessageError(id, ack.code);
      }
      return ack.message;
    },

    onMutate: ({ id, body }) => {
      const messageId = id;
      const optimistic: Message = {
        id: messageId,
        conversationId,
        senderId: currentUserId,
        type: "text",
        body,
        createdAt: new Date().toISOString(),
        status: "sending",
      };
      upsertMessage(queryClient, conversationId, optimistic);
      outbox.add({ id: messageId, conversationId, body });
      return { messageId };
    },

    onSuccess: (message) => {
      outbox.remove(message.id);
      upsertMessage(queryClient, conversationId, {
        ...message,
        status: "sent",
      });
    },

    onError: (error, _variables, context) => {
      const messageId =
        error instanceof SendMessageError
          ? error.messageId
          : context?.messageId;
      if (!messageId) return;

      patchMessage(queryClient, conversationId, messageId, {
        status: "failed",
        errorCode:
          error instanceof SendMessageError ? error.code : "SOCKET_OFFLINE",
      });
    },
  });

  // Sinh `id` ĐÚNG MỘT LẦN, ngay tại biên gọi. Sinh ở cả `onMutate` lẫn
  // `mutationFn` là hai id khác nhau cho cùng một tin: bubble optimistic
  // ("sending") không bao giờ được ack thay thế, và tin server trả về đứng
  // thành bubble thứ hai ("sent").
  // `id` v7 sinh bây giờ luôn lớn hơn mọi id đã có, nên chèn vào đầu là đúng
  // vị trí ngay và không nhảy chỗ khi ack về.
  const { mutate, mutateAsync } = mutation;

  const send = useCallback(
    ({ id, body }: SendMessageVariables) => mutate({ id: id ?? uuidv7(), body }),
    [mutate],
  );

  const sendAsync = useCallback(
    ({ id, body }: SendMessageVariables) =>
      mutateAsync({ id: id ?? uuidv7(), body }),
    [mutateAsync],
  );

  return { ...mutation, mutate: send, mutateAsync: sendAsync };
}

class SendMessageError extends Error {
  constructor(
    readonly messageId: string,
    readonly code: string,
  ) {
    super(code);
    this.name = "SendMessageError";
  }
}

/**
 * Đánh dấu đã đọc. Ưu tiên socket (có ack), fallback REST khi socket offline —
 * để unread không kẹt chỉ vì mất kết nối.
 */
export function useMarkRead(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      if (getSocket()?.connected) {
        await emitWithAck("message:mark-read", { conversationId, messageId });
        return;
      }
      await chatApi.markRead(conversationId, messageId);
    },
    onSuccess: () => {
      // Con trỏ đã đọc chỉ TIẾN, nên về 0 là an toàn.
      patchConversationInList(queryClient, conversationId, { unreadCount: 0 });
    },
  });
}

/* ------------------------------------------------------- typing & presence */

/** TTL 5s và throttle nằm ở đây; store chỉ giữ state. */
const TYPING_THROTTLE_MS = 2_000;

export function useTyping(conversationId: string) {
  const typingUserIds = useEphemeralStore(
    (state) => state.typingByConversation[conversationId],
  );
  const lastEmitRef = useRef(0);

  const start = useCallback(() => {
    const now = Date.now();
    if (now - lastEmitRef.current < TYPING_THROTTLE_MS) return;
    lastEmitRef.current = now;
    emitFireAndForget("typing:start", { conversationId });
  }, [conversationId]);

  const stop = useCallback(() => {
    lastEmitRef.current = 0;
    emitFireAndForget("typing:stop", { conversationId });
  }, [conversationId]);

  return { typingUserIds: typingUserIds ?? EMPTY_IDS, start, stop };
}

const EMPTY_IDS: string[] = [];

/**
 * Presence chỉ có cho người chung hội thoại. Vắng mặt = KHÔNG RÕ, không phải
 * offline — `PresenceDot` phải chịu được điều đó.
 */
export function usePresence(userId: string | null | undefined) {
  return useEphemeralStore((state) =>
    userId ? state.presenceByUser[userId] : undefined,
  );
}

/* ----------------------------------------------------- socket ↔ cache bridge */

/**
 * Cầu nối DUY NHẤT giữa socket và React Query cache. Gọi ở đúng MỘT chỗ
 * (`ChatRealtimeProvider`) — gọi hai lần là mỗi tin append hai lần.
 */
export function useChatSocket(activeConversationId?: string) {
  const queryClient = useQueryClient();
  const authStatus = useAuthStore((state) => state.status);
  const [status, setStatus] = useState<ChatConnectionStatus>("connecting");
  const cleanupRef = useRef<(() => void) | null>(null);

  // Handler dưới đây đọc conversation đang mở qua ref: đổi conversation không
  // được phép tháo và gắn lại toàn bộ listener. Ghi ref trong effect, không
  // trong lúc render.
  const activeIdRef = useRef(activeConversationId);
  useEffect(() => {
    activeIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const setTyping = useEphemeralStore((state) => state.setTyping);
  const setPresence = useEphemeralStore((state) => state.setPresence);
  const clearEphemeral = useEphemeralStore((state) => state.clear);

  useEffect(() => {
    // Chờ auth xong: access token chỉ nằm trong memory, connect sớm là
    // handshake với token rỗng.
    if (authStatus !== "authenticated") return;

    let cancelled = false;

    void connectChatSocket().then((instance) => {
      if (cancelled || !instance) return;

      const onConnect = () => {
        setStatus("online");

        // BẮT BUỘC: socket chỉ chở sự kiện từ lúc connect trở đi. Tin rơi
        // trong lúc mất mạng KHÔNG được bơm lại — thiếu hai dòng này thì mất
        // mạng 30 giây = mất tin, và UI không báo gì.
        queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
        const activeId = activeIdRef.current;
        if (activeId) {
          queryClient.invalidateQueries({
            queryKey: chatKeys.messages(activeId),
          });
        }

        flushOutbox();
      };

      const onDisconnect = () => {
        setStatus("offline");
        // Presence/typing cũ là thông tin sai ngay khi mất kết nối.
        clearEphemeral();
      };

      const onMessageNew = guard((raw) => {
        const { message } = messageNewEventSchema.parse(raw);
        // Dedupe theo `id`: tin của chính mình cũng về qua room này, và có thể
        // về TRƯỚC ack. Cả hai đường đều upsert nên thứ tự nào cũng ra một tin.
        upsertMessage(queryClient, message.conversationId, {
          ...message,
          status: "sent",
        });
      });

      const onMessageRead = guard((raw) => {
        const event = messageReadEventSchema.parse(raw);
        queryClient.setQueryData<Conversation>(
          chatKeys.conversation(event.conversationId),
          (old) =>
            old
              ? {
                  ...old,
                  members: old.members.map((member) =>
                    member.userId === event.userId
                      ? { ...member, lastReadMessageId: event.messageId }
                      : member,
                  ),
                }
              : old,
        );
      });

      const onConversationUpdated = guard((raw) => {
        const event = conversationUpdatedEventSchema.parse(raw);
        // Event mang sẵn lastMessage + unreadCount → setQueryData, KHÔNG
        // invalidate. Invalidate ở mỗi tin đến biến chat sôi nổi thành một
        // tràng request danh sách hội thoại.
        patchConversationInList(queryClient, event.conversationId, {
          lastMessage: event.lastMessage ?? undefined,
          unreadCount: event.unreadCount ?? undefined,
        });
      });

      const onPresence = guard((raw) => {
        const event = presenceChangedEventSchema.parse(raw);
        setPresence(event.userId, event.status, event.lastSeenAt);
      });

      const onTyping = guard((raw) => {
        const event = typingEventSchema.parse(raw);
        setTyping(event.conversationId, event.userId, event.isTyping);
      });

      instance.on("connect", onConnect);
      instance.on("disconnect", onDisconnect);
      instance.on("message:new", onMessageNew);
      instance.on("message:read", onMessageRead);
      instance.on("conversation:updated", onConversationUpdated);
      instance.on("presence:changed", onPresence);
      instance.on("typing", onTyping);

      if (instance.connected) onConnect();

      cleanupRef.current = () => {
        instance.off("connect", onConnect);
        instance.off("disconnect", onDisconnect);
        instance.off("message:new", onMessageNew);
        instance.off("message:read", onMessageRead);
        instance.off("conversation:updated", onConversationUpdated);
        instance.off("presence:changed", onPresence);
        instance.off("typing", onTyping);
      };
    });

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
      disconnectChatSocket();
      clearEphemeral();
    };
    // `activeConversationId` cố tình KHÔNG nằm trong deps — nó đi qua ref.
  }, [authStatus, queryClient, clearEphemeral, setPresence, setTyping]);

  const reconnect = useCallback(() => {
    setStatus("connecting");
    void connectChatSocket().then((instance) => instance?.connect());
  }, []);

  return { status, reconnect };
}

/**
 * Payload lạ hoặc sai shape thì BỎ QUA event đó — không được để một event
 * hỏng làm sập cả kết nối.
 */
function guard(handler: (raw: unknown) => void) {
  return (raw: unknown) => {
    try {
      handler(raw);
    } catch (error) {
      // Không log nội dung tin nhắn — chỉ log lý do.
      console.warn("[chat] bỏ qua event sai shape:", error);
    }
  };
}

/** Gửi lại tin trong outbox. An toàn vì backend idempotent theo `id`. */
function flushOutbox() {
  for (const entry of outbox.drain()) {
    void emitWithAck("message:send", entry).catch(() => {
      // Thất bại thì để nguyên trong outbox, lần connect sau thử lại. KHÔNG
      // vòng lặp retry ở đây — rate limit sẽ biến nó thành đập backend.
    });
  }
}

/* -------------------------------------------------------- cache helpers */

/** Chèn hoặc thay tin theo `id`, luôn ở trang đầu (trang mới nhất). */
function upsertMessage(
  queryClient: QueryClient,
  conversationId: string,
  message: Message,
) {
  queryClient.setQueryData<InfiniteData<MessagePage, string | null>>(
    chatKeys.messages(conversationId),
    (old) => {
      if (!old) return old;

      let replaced = false;
      const pages = old.pages.map((page) => {
        if (!page.items.some((item) => item.id === message.id)) return page;
        replaced = true;
        return {
          ...page,
          items: page.items.map((item) =>
            item.id === message.id ? { ...item, ...message } : item,
          ),
        };
      });

      if (replaced) return { ...old, pages };

      const [first, ...rest] = pages;
      if (!first) return old;
      return {
        ...old,
        pages: [{ ...first, items: [message, ...first.items] }, ...rest],
      };
    },
  );
}

function patchMessage(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
  patch: Partial<Message>,
) {
  queryClient.setQueryData<InfiniteData<MessagePage, string | null>>(
    chatKeys.messages(conversationId),
    (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === messageId ? { ...item, ...patch } : item,
              ),
            })),
          }
        : old,
  );
}

/**
 * Patch một hội thoại trong danh sách rồi đưa nó lên đầu.
 *
 * `ConversationDto` KHÔNG có `lastMessageAt` (backend sort theo cột đó nhưng
 * không lộ ra), nên không sort lại được bằng khoá thật. Thay vào đó: hội thoại
 * vừa có tin mới được đẩy lên đầu — đúng kết quả mà sort theo `last_message_at`
 * sẽ cho, mà không cần khoá.
 */
function patchConversationInList(
  queryClient: QueryClient,
  conversationId: string,
  patch: { lastMessage?: Message | null; unreadCount?: number },
) {
  queryClient.setQueryData<InfiniteData<ConversationPage, string | null>>(
    chatKeys.conversations(),
    (old) => {
      if (!old) return old;

      let found: Conversation | undefined;
      const pages = old.pages.map((page) => ({
        ...page,
        items: page.items.filter((item) => {
          if (item.id !== conversationId) return true;
          found = {
            ...item,
            ...(patch.lastMessage !== undefined
              ? { lastMessage: patch.lastMessage }
              : {}),
            ...(patch.unreadCount !== undefined
              ? { unreadCount: patch.unreadCount }
              : {}),
          };
          return false;
        }),
      }));

      // Không có trong cache (nằm ở trang chưa tải) → để invalidate lo, đừng
      // dựng một Conversation nửa vời từ payload event.
      if (!found) return old;

      const [first, ...rest] = pages;
      if (!first) return old;
      return {
        ...old,
        pages: [{ ...first, items: [found, ...first.items] }, ...rest],
      };
    },
  );

  queryClient.setQueryData<Conversation>(
    chatKeys.conversation(conversationId),
    (old) =>
      old
        ? {
            ...old,
            ...(patch.lastMessage !== undefined
              ? { lastMessage: patch.lastMessage }
              : {}),
            ...(patch.unreadCount !== undefined
              ? { unreadCount: patch.unreadCount }
              : {}),
          }
        : old,
  );
}
