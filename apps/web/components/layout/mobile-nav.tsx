"use client";

import { useAuthStore } from "@noalhub/api/auth";
import { usePathname } from "@noalhub/i18n/navigation";
import { BottomNav } from "@noalhub/ui/bottom-nav";
import { ICONS } from "@noalhub/ui/icons";
import { useTranslations } from "next-intl";

/**
 * The phone-width primary navigation (hidden from `md`, where `SiteHeader`
 * shows the links). Chat needs a session, so it renders dimmed while
 * signed out (as in the Figma Bottom nav) instead of bouncing to a login redirect.
 */
export function MobileNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const signedIn = useAuthStore((s) => s.status === "authenticated");

  const items = [
    { key: "home", label: t("header.home"), icon: ICONS.home, href: "/" },
    { key: "blogs", label: t("header.posts"), icon: ICONS.post, href: "/blogs" },
    { key: "learn", label: t("header.practice"), icon: ICONS.map, href: "/learn" },
    { key: "chat", label: t("footer.chat"), icon: ICONS.chat, href: "/chat", disabled: !signedIn },
    { key: "profile", label: t("header.profile"), icon: ICONS.user, href: "/profile" },
  ];
  // `/` prefixes every path, so Home matches exactly.
  const activeKey = items.find((i) => (i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)))?.key;

  return (
    <BottomNav
      items={items}
      activeKey={activeKey}
      label={t("header.mainLinks")}
      className="sticky bottom-0 z-10 md:hidden"
    />
  );
}
