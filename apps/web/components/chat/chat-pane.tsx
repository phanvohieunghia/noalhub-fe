"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";

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

/** Gộp nhiều lần "đã tới đáy" thành một request. */
const MARK_READ_DEBOUNCE_MS = 500;

export function ChatPane({ conversationId }: { conversationId: string }) {
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

  // `Message` chỉ mang `senderId`; tên/avatar nằm ở `members` của hội thoại.
  // Dựng map một lần ở đây thay vì để mỗi bubble tự tìm trong mảng.
  const members = useMemo(() => memberMap(conversationQuery.data), [conversationQuery.data]);

  const markReadDebounced = useDebouncedMarkRead(markRead);

  const handleReachBottom = useCallback(
    (latestMessageId: string) => {
      // Ba điều kiện cùng lúc, thiếu cái nào cũng thành "đọc hộ" người dùng:
      // đang mở (component này tồn tại), đã cuộn tới đáy (MessageList gọi), và
      // tab đang được xem.
      if (document.visibilityState !== "visible") return;
      markReadDebounced(latestMessageId);
    },
    [markReadDebounced],
  );

  // Gửi lại dùng ĐÚNG `id` cũ — đó là điều kiện để backend dedupe.
  const handleRetry = useCallback(
    (message: Message) => send({ id: message.id, body: message.body }),
    [send],
  );

  // Spec không có 403: người không phải thành viên nhận 404 y như hội thoại
  // không tồn tại. Một màn hình cho cả hai, và KHÔNG logout.
  const notFound =
    conversationQuery.error instanceof ApiError && conversationQuery.error.status === 404;

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <Typography variant="title-4">
          Hội thoại không tồn tại hoặc bạn không có quyền truy cập
        </Typography>
        <Link href="/chat" className="text-body-3 underline underline-offset-2">
          Về danh sách hội thoại
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
 * Debounce + chống gửi lại cùng một con trỏ.
 *
 * Con trỏ đã đọc chỉ được TIẾN. `id` là UUID v7 nên so sánh chuỗi là so sánh
 * thời gian — nhờ đó cuộn lên đọc tin cũ không đẩy con trỏ lùi lại.
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
