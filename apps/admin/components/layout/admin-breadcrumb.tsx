"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "./nav-items";

/**
 * Breadcrumb suy từ pathname, không phải từ state riêng — không có chỗ nào để
 * lệch với URL.
 *
 * Segment cuối của `/users/[id]` là một UUID: hiện nguyên thì vô nghĩa với người
 * đọc, nên rút gọn thành "Chi tiết". Tên user thật do chính trang đó hiện ở
 * `<h1>` (nó mới là chỗ có dữ liệu), breadcrumb không đi fetch thêm.
 */
export function AdminBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const navLabel = NAV_ITEMS.find((item) => item.href === href)?.label;
    return {
      href,
      label: navLabel ?? (index === 0 ? segment : "Chi tiết"),
      isLast: index === segments.length - 1,
    };
  });

  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex items-center gap-1.5">
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            {crumb.isLast ? (
              <span aria-current="page" className="font-medium">
                {crumb.label}
              </span>
            ) : (
              <>
                <Link href={crumb.href} className="opacity-70 hover:underline">
                  {crumb.label}
                </Link>
                <span aria-hidden className="opacity-40">
                  /
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
