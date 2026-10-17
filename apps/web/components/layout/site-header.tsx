"use client";

import { Link } from "@noalhub/i18n/navigation";
import { LogoLockup } from "@noalhub/ui/logo-lockup";
import { useTranslations } from "next-intl";

import { HeaderAccount } from "./header-account";

/**
 * The app header: wordmark on the left, nav links and the account on the right.
 *
 * The account slot is `HeaderAccount` (signed out / signed in). The whole
 * header is hidden below `md`, where `MobileNav` is the primary navigation.
 */
export function SiteHeader() {
  const t = useTranslations("nav");

  const links = [
    { href: "/blogs", label: t("header.posts") },
    { href: "/learn", label: t("header.practice") },
    { href: "/chat", label: t("header.chat") },
  ] as const;

  return (
    <header className="hidden h-16 shrink-0 border-b border-border bg-surface md:block">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 md:px-12">
        <Link href="/" aria-label="Noalhub" className="flex items-center">
          <LogoLockup className="text-title-3" />
        </Link>

        <div className="flex items-center gap-4">
          <nav aria-label={t("header.mainLinks")} className="hidden items-center gap-4 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-title-4 text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <HeaderAccount />
        </div>
      </div>
    </header>
  );
}
