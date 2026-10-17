"use client";

import { Link } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@noalhub/ui/button";
import { Icon, ICONS } from "@noalhub/ui/icons";
import { Typography } from "@noalhub/ui/typography";

/**
 * There is NO "New" button in phase 1: creating a DM needs a `userId`, and the
 * backend has no user search endpoint yet (`GET /api/users?search=` — see
 * `docs/chat.md` §0 #2).
 *
 * A disabled button is deliberately not drawn: a button must not be an empty
 * promise. When that endpoint exists, reopen `NewDirectConversationDialog` here.
 */
export function ChatSidebarHeader() {
  const t = useTranslations("web.chat.sidebar");

  return (
    <div className="flex shrink-0 items-center gap-2 px-4 py-3">
      <Typography variant="h6" as="h1" className="flex-1">
        {t("title")}
      </Typography>

      {/* Friends is a sub-page of chat; its page has the back button. */}
      <Button variant="ghost" size="icon-sm" asChild>
        <Link href="/friends" aria-label={t("friends")}>
          <Icon icon={ICONS.users} />
        </Link>
      </Button>
    </div>
  );
}
