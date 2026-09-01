"use client";

import { Link } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";

import { Avatar } from "@noalhub/ui/avatar";
import { PresenceDot } from "./presence-dot";
import { UnreadBadge } from "./unread-badge";
import { useChatFormat } from "./use-chat-format";
import { useAuthStore } from "@noalhub/api/auth";
import { otherMember } from "@noalhub/core/chat/format";
import type { Conversation } from "@noalhub/api/chat";
import { Typography } from "@noalhub/ui/typography";

export function ConversationListItem({
  conversation,
  active,
}: {
  conversation: Conversation;
  active: boolean;
}) {
  const t = useTranslations("web.chat.sidebar");
  const cf = useChatFormat();
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const name = cf.conversationName(conversation, currentUserId);
  const peer = otherMember(conversation, currentUserId);
  const last = conversation.lastMessage;

  // "Bạn: …" để phân biệt tin mình gửi mà không phải mở hội thoại ra xem.
  const preview = !last
    ? t("noMessages")
    : last.senderId === currentUserId
      ? t("youPrefix", { body: last.body })
      : last.body;

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
            <PresenceDot userId={peer?.userId} className="absolute -right-0.5 -bottom-0.5" />
          ) : null}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-baseline justify-between gap-2">
            <Typography variant="title-4" as="span" className="truncate">
              {name}
            </Typography>
            <span className="shrink-0 text-[11px] opacity-50">
              {cf.conversationTimestamp(last?.createdAt ?? null)}
            </span>
          </span>
          <span className="flex items-center justify-between gap-2">
            <span
              className={`truncate text-body-4 ${
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
