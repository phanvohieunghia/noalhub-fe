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
import { useEphemeralStore } from "./ephemeral-store";
import { outbox } from "./outbox";
import { useAuthStore } from "../auth/store";

/** The ONLY source of truth for this feature's query keys. */
export const chatKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatKeys.all, "conversations"] as const,
  conversation: (id: string) => [...chatKeys.conversations(), id] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, "messages", conversationId] as const,
};

/* ------------------------------------------------------------------ queries */

/**
 * Seeds `presenceByUser` from the REST snapshot.
 *
 * Without this the store stays empty until someone CHANGES state — opening a
 * conversation with someone who is online still shows "unknown", because
 * `presence:changed` only fires on a change. `status: null` means the endpoint
 * did not compute presence (per spec, the conversation list only does so for
 * DMs) → skip it, do not overwrite with "offline".
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
    // This endpoint's cursor is a DATE-TIME (unlike the messages endpoint, where
    // it is a uuid). Always read `nextCursor`; never derive it from `items`.
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
    // The cursor is a UUID. `null` means history is exhausted — a stop condition, not an error.
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
  /** Pass the old `id` back when resending — do NOT mint a new one, it breaks idempotency. */
  id?: string;
  body: string;
};

/** Normalized variables: `id` is ALWAYS present. */
type ResolvedSendMessageVariables = {
  id: string;
  body: string;
};

/**
 * Sending a message: optimistic, acknowledged over the socket.
 *
 * The backend's only write path is the socket event, so this hook makes no REST
 * call. On failure it does NOT roll back — the bubble stays with
 * `status: "failed"` and a retry button, because deleting what someone just
 * typed throws away their work (`docs/chat.md` §5.5).
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

  // Mint the `id` EXACTLY ONCE, right at the call boundary. Minting in both
  // `onMutate` and `mutationFn` produces two ids for one message: the optimistic
  // bubble ("sending") is never replaced by the ack, and the server's message
  // becomes a second bubble ("sent").
  // A v7 `id` minted now is always greater than every existing id, so
  // prepending puts it in the right place immediately and it does not jump when
  // the ack lands.
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
 * Marking as read. Prefers the socket (it has an ack) and falls back to REST
 * while the socket is offline — so the unread badge does not get stuck merely
 * because the connection dropped.
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
      // The read cursor only moves FORWARD, so zeroing this is safe.
      patchConversationInList(queryClient, conversationId, { unreadCount: 0 });
    },
  });
}

/* ------------------------------------------------------- typing & presence */

/** The 5s TTL and the throttle live here; the store only holds state. */
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
 * Presence exists only for people you share a conversation with. Absent means
 * UNKNOWN, not offline — `PresenceDot` has to cope with that.
 */
export function usePresence(userId: string | null | undefined) {
  return useEphemeralStore((state) =>
    userId ? state.presenceByUser[userId] : undefined,
  );
}

/* ----------------------------------------------------- socket ↔ cache bridge */

/**
 * The ONLY bridge between the socket and the React Query cache. Called in
 * exactly ONE place (`ChatRealtimeProvider`) — call it twice and every message
 * is appended twice.
 */
export function useChatSocket(activeConversationId?: string) {
  const queryClient = useQueryClient();
  const authStatus = useAuthStore((state) => state.status);
  const [status, setStatus] = useState<ChatConnectionStatus>("connecting");
  const cleanupRef = useRef<(() => void) | null>(null);

  // The handlers below read the open conversation through a ref: switching
  // conversations must not tear down and re-attach every listener. The ref is
  // written in an effect, never during render.
  const activeIdRef = useRef(activeConversationId);
  useEffect(() => {
    activeIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const setTyping = useEphemeralStore((state) => state.setTyping);
  const setPresence = useEphemeralStore((state) => state.setPresence);
  const clearEphemeral = useEphemeralStore((state) => state.clear);

  useEffect(() => {
    // Wait for auth: the access token lives in memory only, so connecting early
    // means a handshake with an empty token.
    if (authStatus !== "authenticated") return;

    let cancelled = false;

    void connectChatSocket().then((instance) => {
      if (cancelled || !instance) return;

      const onConnect = () => {
        setStatus("online");

        // REQUIRED: the socket only carries events from the moment it connects.
        // Messages missed while offline are NOT replayed — without these two
        // lines, 30 seconds offline means lost messages and a UI that says
        // nothing.
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
        // Stale presence/typing becomes wrong the instant the connection drops.
        clearEphemeral();
      };

      const onMessageNew = guard((raw) => {
        const { message } = messageNewEventSchema.parse(raw);
        // Deduped by `id`: your own messages also come back through this room,
        // and can arrive BEFORE the ack. Both paths upsert, so either order ends
        // with one message.
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
        // The event already carries lastMessage + unreadCount → setQueryData,
        // never invalidate. Invalidating on every incoming message turns a
        // lively chat into a burst of conversation-list requests.
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
    // `activeConversationId` is deliberately NOT in the deps — it goes through the ref.
  }, [authStatus, queryClient, clearEphemeral, setPresence, setTyping]);

  const reconnect = useCallback(() => {
    setStatus("connecting");
    void connectChatSocket().then((instance) => instance?.connect());
  }, []);

  return { status, reconnect };
}

/**
 * An unknown or malformed payload means that event is SKIPPED — one bad event
 * must never bring down the whole connection.
 */
function guard(handler: (raw: unknown) => void) {
  return (raw: unknown) => {
    try {
      handler(raw);
    } catch (error) {
      // Never log message content — only the reason.
      console.warn("[chat] skipping malformed event:", error);
    }
  };
}

/** Resends the outbox. Safe because the backend is idempotent on `id`. */
function flushOutbox() {
  for (const entry of outbox.drain()) {
    void emitWithAck("message:send", entry).catch(() => {
      // On failure leave it in the outbox and retry on the next connect. No
      // retry loop here — the rate limiter would turn it into a hammering.
    });
  }
}

/* -------------------------------------------------------- cache helpers */

/** Inserts or replaces a message by `id`, always on the first (newest) page. */
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
 * Patches one conversation in the list and moves it to the top.
 *
 * `ConversationDto` has NO `lastMessageAt` (the backend sorts by that column but
 * does not expose it), so there is no real key to re-sort by. Instead: the
 * conversation that just received a message is pushed to the front — the same
 * result sorting by `last_message_at` would give, without the key.
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

      // Not in the cache (it is on a page not yet loaded) → leave it to
      // invalidation; do not build a half-formed Conversation from the event.
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
