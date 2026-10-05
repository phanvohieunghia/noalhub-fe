"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { FLAT_NAV_ITEMS, NON_ROUTE_SEGMENTS, SEGMENT_LABEL_KEYS } from "./nav-items";

/**
 * The breadcrumb is derived from the pathname, not from separate state — so
 * there is nowhere for it to drift from the URL.
 *
 * The last segment of `/users/[id]` is a UUID: showing it raw means nothing to
 * a reader, so it collapses to "Detail". The real user name is rendered by that
 * page's own `<h1>` (which is where the data is); the breadcrumb fetches
 * nothing.
 *
 * Lookup order: `SEGMENT_LABEL_KEYS` (a name for the segment itself, e.g.
 * `/posts/new`, `/qa`) → nav items, sub-items included → "Detail". The segment
 * map wins because a nav entry's label names a *destination*, which is not
 * always the name of its last segment — "Q&A" points at `/qa/datasets`.
 *
 * A segment in `NON_ROUTE_SEGMENTS` is a grouping folder with no page: it
 * stays in the trail for orientation but is not a link.
 */
export function AdminBreadcrumb() {
  const t = useTranslations("nav.admin");
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const key =
      SEGMENT_LABEL_KEYS[segment] ??
      FLAT_NAV_ITEMS.find((item) => item.href === href)?.labelKey;
    return {
      href,
      // A first segment matching no key is shown verbatim: it is a meaningful
      // path segment, and turning it into "Detail" loses information.
      label: key ? t(key) : index === 0 ? segment : t("detail"),
      isLast: index === segments.length - 1,
      isRoute: !NON_ROUTE_SEGMENTS.has(segment),
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
            ) : !crumb.isRoute ? (
              <>
                <span className="opacity-70">{crumb.label}</span>
                <span aria-hidden className="opacity-40">
                  /
                </span>
              </>
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
