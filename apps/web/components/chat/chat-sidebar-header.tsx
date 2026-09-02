"use client";

import { useTranslations } from "next-intl";

import { Typography } from "@noalhub/ui/typography";

import { ChatUserMenu } from "./chat-user-menu";

/**
 * There is NO "New" button in phase 1: creating a DM needs a `userId`, and the
 * backend has no user search endpoint yet (`GET /api/users?search=` — see
 * `docs/chat.md` §0 #2).
 *
 * A disabled button is deliberately not drawn: a button must not be an empty
 * promise. When that endpoint exists, reopen `NewDirectConversationDialog` here.
 *
 * "Friends" already lives in `ChatUserMenu`, so it is not repeated here.
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
