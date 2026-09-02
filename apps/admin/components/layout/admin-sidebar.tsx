"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "./nav-items";
import { Logo } from "@noalhub/ui/logo";
import { Typography } from "@noalhub/ui/typography";

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const ta = useTranslations("nav.admin");

  return (
    <aside className="w-56 shrink-0 border-r border-black/10 p-3 dark:border-white/15">
      <div className="flex items-center gap-2 px-2 py-3">
        <Logo className="size-7" />
        <Typography variant="title-4" weight={600}>
          {t("adminTitle")}
        </Typography>
      </div>
      <nav aria-label={ta("mainNav")} className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          // startsWith so `/users/[id]` still highlights the "Users" item;
          // false prefix matches are ruled out by requiring the next character
          // to be "/".
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (item.disabled) {
            return (
              <Typography
                variant="body-3"
                as="span"
                key={item.href}
                title={item.reasonKey ? ta(item.reasonKey) : undefined}
                aria-disabled="true"
                className="cursor-not-allowed rounded-md px-2 py-1.5 opacity-40"
              >
                {ta(item.labelKey)}
              </Typography>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-md px-2 py-1.5 text-body-3 transition-colors ${
                isActive
                  ? "bg-black/8 font-medium dark:bg-white/12"
                  : "hover:bg-black/5 dark:hover:bg-white/8"
              }`}
            >
              {ta(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
