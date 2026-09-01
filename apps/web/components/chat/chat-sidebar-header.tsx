"use client";

import { useTranslations } from "next-intl";

import { Typography } from "@noalhub/ui/typography";

import { ChatUserMenu } from "./chat-user-menu";

/**
 * Nút "Mới" CHƯA có ở giai đoạn 1: tạo DM cần `userId`, mà backend chưa có
 * endpoint tìm người dùng (`GET /api/users?search=` — xem `docs/chat.md` §0 #2).
 *
 * Cố ý không vẽ nút disabled: nút bấm không được là lời hứa suông. Khi endpoint
 * đó có thật thì mở lại `NewDirectConversationDialog` ở đây.
 *
 * "Bạn bè" đã nằm trong `ChatUserMenu` nên không lặp lại ở đây.
 */
export function ChatSidebarHeader() {
  const t = useTranslations("web.chat.sidebar");

  return (
    <div className="flex shrink-0 items-center gap-2 px-4 py-3">
      <ChatUserMenu />

      <Typography variant="h6" as="h1">
        {t("title")}
      </Typography>
    </div>
  );
}
