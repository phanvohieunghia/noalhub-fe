"use client";

import { Link } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Avatar } from "@noalhub/ui/avatar";
import { MemberProfileDrawer } from "./member-profile-drawer";
import { PresenceDot, PresenceLabel } from "./presence-dot";
import { useChatFormat } from "./use-chat-format";
import { useAuthStore } from "@noalhub/api/auth";
import { otherMember } from "@noalhub/core/chat/format";
import type { Conversation } from "@noalhub/api/chat";
import { Typography } from "@noalhub/ui/typography";

export function ChatHeader({ conversation }: { conversation: Conversation }) {
  const t = useTranslations("web.chat.header");
  const cf = useChatFormat();
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const name = cf.conversationName(conversation, currentUserId);
  const peer = otherMember(conversation, currentUserId);
  const isDirect = conversation.type === "direct";
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
      {/* Nút back chỉ có nghĩa ở mobile — desktop luôn thấy sidebar. */}
      <Link
        href="/chat"
        aria-label={t("backToList")}
        className="-ml-1 rounded-md px-1 py-0.5 text-title-2 leading-none opacity-70 hover:opacity-100 md:hidden"
      >
        ◀
      </Link>

      {/* Avatar mở hồ sơ; group chưa xác định được "người kia" nên chỉ là hình. */}
      {peer ? (
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-label={t("viewProfile", { name })}
          className="relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
        >
          <Avatar name={name} src={peer.avatarUrl} size="sm" />
          {isDirect ? (
            <PresenceDot userId={peer.userId} className="absolute -right-0.5 -bottom-0.5" />
          ) : null}
        </button>
      ) : (
        <span className="relative shrink-0">
          <Avatar name={name} src={null} size="sm" />
        </span>
      )}

      <div className="flex min-w-0 flex-col">
        <Typography variant="title-4" weight={600} as="span" className="truncate">
          {name}
        </Typography>
        {isDirect ? (
          <PresenceLabel userId={peer?.userId} />
        ) : (
          <Typography variant="body-4" as="span" className="opacity-60">
            {t("memberCount", { count: conversation.members.length })}
          </Typography>
        )}
      </div>

      {peer ? (
        <MemberProfileDrawer
          member={peer}
          name={name}
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
        />
      ) : null}
    </div>
  );
}
