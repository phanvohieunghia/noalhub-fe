"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "./nav-items";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-black/10 p-3 dark:border-white/15">
      <p className="px-2 py-3 text-sm font-semibold">Noalhub Admin</p>
      <nav aria-label="Điều hướng chính" className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          // startsWith để `/users/[id]` vẫn sáng mục "Người dùng"; chặn khớp
          // nhầm tiền tố bằng cách đòi ký tự kế tiếp là "/".
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (item.disabled) {
            return (
              <span
                key={item.href}
                title={item.reason}
                aria-disabled="true"
                className="cursor-not-allowed rounded-md px-2 py-1.5 text-sm opacity-40"
              >
                {item.label}
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-md px-2 py-1.5 text-sm transition-colors ${
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
