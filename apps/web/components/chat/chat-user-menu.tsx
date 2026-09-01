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
 * Menu tài khoản của khu vực chat, mở từ icon ba gạch ở đầu sidebar.
 *
 * Chat là màn hình cao đúng viewport, không có header chung và không có
 * `SiteFooter` — nên đây là chỗ DUY NHẤT trong `/chat` để xem mình đang đăng
 * nhập bằng tài khoản nào, đổi giao diện và đăng xuất.
 *
 * Dựng trên `DropdownMenu` của `@noalhub/ui` giống hệt menu tài khoản bên
 * admin: click ra ngoài, `Esc`, `aria-expanded` và định vị tránh tràn viewport
 * đều do Radix lo.
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
