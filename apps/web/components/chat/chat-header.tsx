"use client";

import Link from "next/link";
import { useState } from "react";

import { Avatar } from "@noalhub/ui/avatar";
import { MemberProfileDrawer } from "./member-profile-drawer";
import { PresenceDot, PresenceLabel } from "./presence-dot";
import { useAuthStore } from "@noalhub/api/auth";
import { conversationDisplayName, otherMember } from "@noalhub/core/chat/format";
import type { Conversation } from "@noalhub/api/chat";

export function ChatHeader({ conversation }: { conversation: Conversation }) {
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const name = conversationDisplayName(conversation, currentUserId);
  const peer = otherMember(conversation, currentUserId);
  const isDirect = conversation.type === "direct";
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
      {/* Nút back chỉ có nghĩa ở mobile — desktop luôn thấy sidebar. */}
      <Link
        href="/chat"
        aria-label="Về danh sách hội thoại"
        className="-ml-1 rounded-md px-1 py-0.5 text-lg leading-none opacity-70 hover:opacity-100 md:hidden"
      >
        ◀
      </Link>

      {/* Avatar mở hồ sơ; group chưa xác định được "người kia" nên chỉ là hình. */}
      {peer ? (
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-label={`Xem hồ sơ của ${name}`}
          className="relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-foreground/60"
        >
          <Avatar name={name} src={peer.avatarUrl} size="sm" />
          {isDirect ? (
            <PresenceDot
              userId={peer.userId}
              className="absolute -right-0.5 -bottom-0.5"
            />
          ) : null}
        </button>
      ) : (
        <span className="relative shrink-0">
          <Avatar name={name} src={null} size="sm" />
        </span>
      )}

      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold">{name}</span>
        {isDirect ? <PresenceLabel userId={peer?.userId} /> : (
          <span className="text-xs opacity-60">
            {conversation.members.length} thành viên
          </span>
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
