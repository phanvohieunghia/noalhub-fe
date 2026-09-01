"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, SEGMENT_LABEL_KEYS } from "./nav-items";

/**
 * Breadcrumb suy từ pathname, không phải từ state riêng — không có chỗ nào để
 * lệch với URL.
 *
 * Segment cuối của `/users/[id]` là một UUID: hiện nguyên thì vô nghĩa với người
 * đọc, nên rút gọn thành "Chi tiết". Tên user thật do chính trang đó hiện ở
 * `<h1>` (nó mới là chỗ có dữ liệu), breadcrumb không đi fetch thêm.
 *
 * Thứ tự tra: mục nav → `SEGMENT_LABEL_KEYS` (segment có tên thật nhưng không
 * lên sidebar, vd `/posts/categories`) → "Chi tiết".
 */
export function AdminBreadcrumb() {
  const t = useTranslations("nav.admin");
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const key = NAV_ITEMS.find((item) => item.href === href)?.labelKey ?? SEGMENT_LABEL_KEYS[segment];
    return {
      href,
      // Segment đầu không khớp khoá nào thì hiện nguyên văn: đó là một đoạn
      // đường dẫn có nghĩa, dịch nó thành "Chi tiết" là mất thông tin.
      label: key ? t(key) : index === 0 ? segment : t("detail"),
      isLast: index === segments.length - 1,
    };
  });

  return (
    <nav aria-label={t("breadcrumb")} className="text-body-3">
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
