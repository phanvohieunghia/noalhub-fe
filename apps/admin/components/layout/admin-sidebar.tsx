"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "./nav-items";
import { Typography } from "@noalhub/ui/typography";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-black/10 p-3 dark:border-white/15">
      <Typography variant="title-4" weight={600} className="px-2 py-3">
        Noalhub Admin
      </Typography>
      <nav aria-label="Điều hướng chính" className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          // startsWith để `/users/[id]` vẫn sáng mục "Người dùng"; chặn khớp
          // nhầm tiền tố bằng cách đòi ký tự kế tiếp là "/".
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (item.disabled) {
            return (
              <Typography
                variant="body-3"
                as="span"
                key={item.href}
                title={item.reason}
                aria-disabled="true"
                className="cursor-not-allowed rounded-md px-2 py-1.5 opacity-40"
              >
                {item.label}
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
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
