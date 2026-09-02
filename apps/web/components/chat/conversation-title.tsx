"use client";

import { useAuthStore } from "@noalhub/api/auth";
import type { Conversation } from "@noalhub/api/chat";

import { useChatFormat } from "./use-chat-format";

/**
 * The conversation's name. A DM has no `title`, so the name comes from the other
 * member — which requires knowing who "I" am, so the component reads the auth
 * store itself instead of making every call site thread `currentUserId` down.
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
