"use client";

import { conversationDisplayName } from "@/lib/chat/format";
import { useAuthStore } from "@/lib/auth/store";
import type { Conversation } from "@/services/chat/types";

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
    <span className={className}>
      {conversationDisplayName(conversation, currentUserId)}
    </span>
  );
}
