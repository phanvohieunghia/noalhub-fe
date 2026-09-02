"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, SEGMENT_LABEL_KEYS } from "./nav-items";

/**
 * The breadcrumb is derived from the pathname, not from separate state — so
 * there is nowhere for it to drift from the URL.
 *
 * The last segment of `/users/[id]` is a UUID: showing it raw means nothing to
 * a reader, so it collapses to "Detail". The real user name is rendered by that
 * page's own `<h1>` (which is where the data is); the breadcrumb fetches
 * nothing.
 *
 * Lookup order: nav items → `SEGMENT_LABEL_KEYS` (segments with a real name that
 * are not in the sidebar, e.g. `/posts/categories`) → "Detail".
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
      // A first segment matching no key is shown verbatim: it is a meaningful
      // path segment, and turning it into "Detail" loses information.
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
