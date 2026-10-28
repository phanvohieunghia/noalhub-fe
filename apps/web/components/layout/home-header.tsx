import { Link } from "@noalhub/i18n/navigation";
import { LogoLockup } from "@noalhub/ui/logo-lockup";
import { getTranslations } from "next-intl/server";

import { HeaderAccount } from "./header-account";

/**
 * The home page header (Figma `Header`, `Auth=Public` / `Public signed in`).
 *
 * It floats over the page glow, so it has no fill or border. Brand and actions
 * are both `flex-1`, which centres the links between them from `md` up (Tablet
 * and Laptop); on Mobile there are no links, so the actions are pushed to the right.
 * The account slot is search + theme switch + "Sign in" when signed out, and
 * just the avatar when signed in.
 */
export async function HomeHeader() {
  const t = await getTranslations("nav");

  const links = [
    { href: "/blogs", label: t("header.posts") },
    { href: "/learn", label: t("header.practice") },
    { href: "/chat", label: t("header.chat") },
  ] as const;

  return (
    <header className="h-14 md:h-16">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center px-4 md:px-12 lg:px-25">
        <div className="flex flex-1 items-center">
          <Link href="/" aria-label="Noalhub" className="flex items-center">
            <LogoLockup className="text-title-3" />
          </Link>
        </div>

        <nav aria-label={t("header.mainLinks")} className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-body-3 text-foreground transition-opacity hover:opacity-70"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-3">
          <HeaderAccount />
        </div>
      </div>
    </header>
  );
}
