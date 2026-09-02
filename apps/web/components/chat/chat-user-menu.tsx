"use client";

import { Link } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";

import { LogoutButton } from "@/components/auth/logout-button";
import { useAuthStore } from "@noalhub/api/auth";
import { Avatar } from "@noalhub/ui/avatar";
import { Button } from "@noalhub/ui/button";
import { DropdownMenu } from "@noalhub/ui/dropdown-menu";
import { Icon, ICONS } from "@noalhub/ui/icons";
import { ThemeToggle } from "@noalhub/ui/theme/theme-toggle";
import { Typography } from "@noalhub/ui/typography";

/**
 * The chat area's account menu, opened from the hamburger icon at the top of the
 * sidebar.
 *
 * Chat is exactly viewport-height with no shared header and no `SiteFooter` — so
 * this is the ONLY place inside `/chat` to see which account you are signed in
 * as, change the appearance, and sign out.
 *
 * Built on `@noalhub/ui`'s `DropdownMenu`, exactly like admin's account menu:
 * outside clicks, `Esc`, `aria-expanded` and viewport-aware positioning all come
 * from Radix.
 */
export function ChatUserMenu() {
  const t = useTranslations("web.chat.header");
  const user = useAuthStore((s) => s.user);
  const name = user?.displayName || user?.username || "";

  return (
    <DropdownMenu
      align="start"
      className="w-64"
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label={t("accountMenu")}>
          <Icon icon={ICONS.menu} />
        </Button>
      }
    >
      <div className="flex items-center gap-3">
        <Avatar name={name} src={user?.avatarUrl} size="md" />
        <div className="min-w-0">
          <Typography variant="title-4" className="truncate">
            {name || "—"}
          </Typography>
          <Typography variant="body-4" className="truncate opacity-70">
            {user?.email}
          </Typography>
        </div>
      </div>

      <nav className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-body-3 hover:bg-muted"
        >
          <Icon icon={ICONS.user} />
          {t("profile")}
        </Link>
        <Link
          href="/friends"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-body-3 hover:bg-muted"
        >
          <Icon icon={ICONS.users} />
          {t("friends")}
        </Link>
      </nav>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        <Typography variant="body-4" className="opacity-70">
          {t("appearance")}
        </Typography>
        <ThemeToggle />
      </div>

      <div className="mt-3">
        <LogoutButton className="w-full" />
      </div>
    </DropdownMenu>
  );
}
