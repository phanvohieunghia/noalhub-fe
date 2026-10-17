"use client";

import { useAuthStore } from "@noalhub/api/auth";
import { Link } from "@noalhub/i18n/navigation";
import { Avatar } from "@noalhub/ui/avatar";
import { Button } from "@noalhub/ui/button";
import { DropdownMenu } from "@noalhub/ui/dropdown-menu";
import { Icon, ICONS } from "@noalhub/ui/icons";
import { ThemeToggle } from "@noalhub/ui/theme/theme-toggle";
import { Typography } from "@noalhub/ui/typography";
import { useTranslations } from "next-intl";

import { LogoutButton } from "@/components/auth/logout-button";

import { WebLanguageSwitcher } from "./language-switcher";

/**
 * The account slot shared by `SiteHeader` and `HomeHeader`, picked from the
 * auth store. Signed out shows search, the light/dark switch and a "Sign in"
 * button (`signInClassName` lets a caller hide it at some widths); signed in swaps those for the avatar,
 * which opens a menu with the user's info, the theme switch and "Sign out".
 * While the session is still being restored (`idle`/`loading`) it renders
 * nothing rather than flashing the signed-out controls at a signed-in user.
 */
export function HeaderAccount({ signInClassName = "" }: { signInClassName?: string }) {
  const t = useTranslations("nav");
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const name = user?.displayName || user?.username || "";
  const itemClass = "flex items-center gap-2 rounded-md px-2 py-1.5 text-body-3 hover:bg-muted";
  const links = [
    { href: "/blogs", label: t("header.posts"), icon: ICONS.post },
    { href: "/learn", label: t("header.practice"), icon: ICONS.map },
    { href: "/chat", label: t("header.chat"), icon: ICONS.chat },
  ] as const;

  if (status === "authenticated") {
    return (
      <DropdownMenu
        className="w-64"
        trigger={
          <button type="button" aria-label={t("account")} className="rounded-full focus-visible:outline-2 focus-visible:outline-ring">
            <Avatar name={name} src={user?.avatarUrl} size="sm" className="bg-primary text-primary-foreground" />
          </button>
        }
      >
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="-m-1 flex min-w-0 flex-1 items-center gap-3 rounded-md p-1 hover:bg-muted"
          >
            <Avatar name={name} src={user?.avatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <Typography variant="title-4" className="truncate">
                {name || "—"}
              </Typography>
              <Typography variant="body-4" className="truncate opacity-70">
                {user?.email}
              </Typography>
            </div>
          </Link>
          <LogoutButton iconOnly />
        </div>

        <nav className="mt-3 flex flex-col gap-1 border-t border-border pt-3 md:hidden">
          {/* The header hides these links below `md`, so phones reach them here. */}
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={itemClass}>
              <Icon icon={link.icon} />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
          <div className="flex items-center justify-between gap-2">
            <Typography variant="body-4" className="opacity-70">
              {t("appearance")}
            </Typography>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Typography variant="body-4" className="opacity-70">
              {t("language")}
            </Typography>
            <WebLanguageSwitcher className="shrink-0" />
          </div>
        </div>
      </DropdownMenu>
    );
  }

  if (status === "unauthenticated") {
    return (
      <>
        <Button asChild variant="ghost" size="icon-sm">
          <Link href="/blogs" aria-label={t("header.search")}>
            <Icon icon={ICONS.search} />
          </Link>
        </Button>
        <ThemeToggle />
        <Button asChild variant="ghost" size="sm" className={signInClassName}>
          <Link href="/login">{t("login")}</Link>
        </Button>
      </>
    );
  }

  return null;
}
