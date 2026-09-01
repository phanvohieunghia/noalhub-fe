"use client";

import { useAuthStore } from "@noalhub/api/auth";
import type { Conversation } from "@noalhub/api/chat";

import { useChatFormat } from "./use-chat-format";

/**
 * Tên hội thoại. DM không có `title` nên tên phải lấy từ thành viên còn lại —
 * việc đó cần biết "mình là ai", nên component tự đọc auth store thay vì bắt
 * mọi chỗ gọi truyền `currentUserId` xuống.
 */
export function ConversationTitle({
  conversation,
  className = "",
}: {
  conversation: Conversation;
  className?: string;
}) {
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  return (
    <span className={className}>{useChatFormat().conversationName(conversation, currentUserId)}</span>
  );
}
