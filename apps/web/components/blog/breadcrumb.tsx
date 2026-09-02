import { Link } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";

import { JsonLd } from "./json-ld";
import { absoluteUrl } from "@noalhub/core/blog/seo";

export type Crumb = { label: string; href?: string };

/**
 * The visible breadcrumb **and** the `BreadcrumbList` JSON-LD, from one array.
 *
 * Sharing a single source is deliberate: structured data on a page with no real
 * breadcrumb is a mismatch in Google's eyes, and two separately written lists
 * drift apart on the first edit (§6.1, §6.2).
 *
 * The category axis is what gives posts a **three-level** breadcrumb:
 * Blog → <category> → <post title>. Without that axis there are only two levels
 * and it is close to meaningless (§6.2).
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
                // The last item is the current page — it does not link to itself.
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
