"use client";

import { Link } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { ChatHeader } from "./chat-header";
import { MessageComposer } from "./message-composer";
import { MessageList } from "./message-list";
import { TypingIndicator } from "./typing-indicator";
import { useAuthStore } from "@noalhub/api/auth";
import { memberMap } from "@noalhub/core/chat/format";
import {
  useConversation,
  useMarkRead,
  useMessages,
  useSendMessage,
  useTyping,
} from "@noalhub/api/chat";
import { ApiError } from "@noalhub/api/errors";
import type { Message } from "@noalhub/api/chat";
import { Typography } from "@noalhub/ui/typography";

/** Collapses repeated "reached the bottom" events into one request. */
const MARK_READ_DEBOUNCE_MS = 500;

export function ChatPane({ conversationId }: { conversationId: string }) {
  const t = useTranslations("web.chat.conversation");
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

  const conversationQuery = useConversation(conversationId);
  const messagesQuery = useMessages(conversationId);
  const { mutate: send } = useSendMessage(conversationId);
  const { mutate: markRead } = useMarkRead(conversationId);
  const { typingUserIds } = useTyping(conversationId);

  const messages = useMemo(
    () => messagesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [messagesQuery.data],
  );

  // A `Message` carries only `senderId`; names and avatars live in the
  // conversation's `members`. The map is built once here rather than letting
  // every bubble search the array.
  const members = useMemo(() => memberMap(conversationQuery.data), [conversationQuery.data]);

  const markReadDebounced = useDebouncedMarkRead(markRead);

  const handleReachBottom = useCallback(
    (latestMessageId: string) => {
      // Three conditions at once; missing any of them marks messages read on the
      // user's behalf: the conversation is open (this component exists), it is
      // scrolled to the bottom (MessageList calls in), and the tab is visible.
      if (document.visibilityState !== "visible") return;
      markReadDebounced(latestMessageId);
    },
    [markReadDebounced],
  );

  // A resend uses the SAME `id` — that is what lets the backend dedupe.
  const handleRetry = useCallback(
    (message: Message) => send({ id: message.id, body: message.body }),
    [send],
  );

  // The spec has no 403: a non-member gets the same 404 as a nonexistent
  // conversation. One screen for both, and NO logout.
  const notFound =
    conversationQuery.error instanceof ApiError && conversationQuery.error.status === 404;

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <Typography variant="title-4">
          {t("notFound")}
        </Typography>
        <Link href="/chat" className="text-body-3 underline underline-offset-2">
          {t("backToList")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {conversationQuery.data ? (
        <ChatHeader conversation={conversationQuery.data} />
      ) : (
        <div className="h-[57px] border-b border-black/10 dark:border-white/10" />
      )}

      <MessageList
        messages={messages}
        members={members}
        currentUserId={currentUserId}
        isPending={messagesQuery.isPending}
        error={messagesQuery.error}
        hasOlder={Boolean(messagesQuery.hasNextPage)}
        isFetchingOlder={messagesQuery.isFetchingNextPage}
        onLoadOlder={() => void messagesQuery.fetchNextPage()}
        onRetry={handleRetry}
        onReachBottom={handleReachBottom}
      />

      <TypingIndicator userIds={typingUserIds} members={members} />

      <MessageComposer conversationId={conversationId} />
    </div>
  );
}

/**
 * Debouncing plus a guard against resending the same cursor.
 *
 * The read cursor may only move FORWARD. `id` is a UUID v7, so a string
 * comparison is a time comparison — which is why scrolling up to read old
 * messages never pushes the cursor backwards.
 */
function useDebouncedMarkRead(markRead: (messageId: string) => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return useCallback(
    (messageId: string) => {
      const last = lastSentRef.current;
      if (last !== null && messageId.localeCompare(last) <= 0) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        lastSentRef.current = messageId;
        markRead(messageId);
      }, MARK_READ_DEBOUNCE_MS);
    },
    [markRead],
  );
}
