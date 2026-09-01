import { Link } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";

import { JsonLd } from "./json-ld";
import { absoluteUrl } from "@noalhub/core/blog/seo";

export type Crumb = { label: string; href?: string };

/**
 * Breadcrumb hiển thị **và** `BreadcrumbList` JSON-LD từ cùng một mảng.
 *
 * Dùng chung một nguồn là cố ý: có structured data mà trang không có breadcrumb
 * thật là thứ Google coi là không khớp, và hai danh sách viết rời sẽ lệch ngay
 * lần sửa đầu tiên (§6.1, §6.2).
 *
 * Nhờ có trục chuyên mục, bài viết được breadcrumb **ba cấp**:
 * Blog → <chuyên mục> → <tiêu đề bài>. Không có trục đó thì chỉ còn hai cấp và
 * gần như vô nghĩa (§6.2).
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const t = useTranslations("web.blog.breadcrumb");

  return (
    <>
      <nav aria-label={t("label")} className="text-body-3 opacity-70">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {item.href ? (
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              ) : (
                // Mục cuối là trang hiện tại — không link về chính nó.
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            ...(item.href ? { item: absoluteUrl(item.href) } : {}),
          })),
        }}
      />
    </>
  );
}
