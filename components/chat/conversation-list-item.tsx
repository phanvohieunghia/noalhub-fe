"use client";

import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { PresenceDot } from "./presence-dot";
import { UnreadBadge } from "./unread-badge";
import { useAuthStore } from "@/lib/auth/store";
import {
  conversationDisplayName,
  conversationTimestamp,
  otherMember,
} from "@/lib/chat/format";
import type { Conversation } from "@/services/chat/types";

export function ConversationListItem({
  conversation,
  active,
}: {
  conversation: Conversation;
  active: boolean;
}) {
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const name = conversationDisplayName(conversation, currentUserId);
  const peer = otherMember(conversation, currentUserId);
  const last = conversation.lastMessage;

  // "Bạn: …" để phân biệt tin mình gửi mà không phải mở hội thoại ra xem.
  const preview = last
    ? `${last.senderId === currentUserId ? "Bạn: " : ""}${last.body}`
    : "Chưa có tin nhắn";

  return (
    <li>
      <Link
        href={`/chat/${conversation.id}`}
        // `aria-current="page"` là cách screen reader biết item nào đang mở —
        // tô màu nền một mình không nói được điều đó.
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
          active
            ? "bg-black/[0.07] dark:bg-white/10"
            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        }`}
      >
        <span className="relative shrink-0">
          <Avatar name={name} src={peer?.avatarUrl} />
          {conversation.type === "direct" ? (
            <PresenceDot
              userId={peer?.userId}
              className="absolute -right-0.5 -bottom-0.5"
            />
          ) : null}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="shrink-0 text-[11px] opacity-50">
              {conversationTimestamp(last?.createdAt ?? null)}
            </span>
          </span>
          <span className="flex items-center justify-between gap-2">
            <span
              className={`truncate text-xs ${
                conversation.unreadCount > 0 ? "font-medium" : "opacity-60"
              }`}
            >
              {preview}
            </span>
            <UnreadBadge count={conversation.unreadCount} />
          </span>
        </span>
      </Link>
    </li>
  );
}
