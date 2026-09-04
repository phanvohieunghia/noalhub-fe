import { Link } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";

/**
 * Pagination made of **real `<a href>`s**, for public pages.
 *
 * Why not reuse `pagination.tsx`: that one is `"use client"` with an
 * `onPageChange` button. Googlebot runs JS but **does not click buttons**, so
 * from page 2 onwards there is no crawl path from inside the site. Posts still
 * reach the index through the sitemap, so nothing is lost outright; what is
 * lost is **all internal linking**, and sitemap-only URLs are ranked lower
 * (`docs/blog.md` §4.5).
 *
 * Two components rather than a rewrite of the old one: the admin table has to
 * keep state on the client — two different needs.
 *
 * `Link` comes from `@noalhub/i18n/navigation` (next-intl's version), not
 * `next/link`: this component is used only in `apps/web`'s public section,
 * where URLs carry a locale prefix. With `next/link`, page 2 loses the prefix
 * and an English reader is thrown back to the Vietnamese version on the first
 * page turn.
 */
export function PaginationLinks({
  basePath,
  page,
  limit,
  total,
  label,
}: {
  /** The path without a query, e.g. `/blogs` or `/blogs/category/huong-dan`. */
  basePath: string;
  page: number;
  limit: number;
  total: number;
  /** Left out, the generic "Pagination" label is used. */
  label?: string;
}) {
  const t = useTranslations("common.pagination");
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  if (pageCount <= 1) return null;

  // Page 1 carries NO `?page=1` — it has to match the canonical, or `/blogs`
  // and `/blogs?page=1` are two URLs with one content (§4.5).
  const hrefFor = (target: number) => (target <= 1 ? basePath : `${basePath}?page=${target}`);

  return (
    <nav
      aria-label={label ?? t("label")}
      className="flex items-center justify-between gap-3 pt-8 text-body-3"
    >
      <PageLink
        href={hrefFor(page - 1)}
        // `rel="prev"/"next"`: Google dropped it in 2019, but Bing and RSS
        // readers still read it. Worth setting, never a substitute for a real <a>.
        rel="prev"
        disabled={page <= 1}
      >
        ← {t("previous")}
      </PageLink>

      <span className="tabular-nums opacity-60">{t("current", { page, total: pageCount })}</span>

      <PageLink href={hrefFor(page + 1)} rel="next" disabled={page >= pageCount}>
        {t("next")} →
      </PageLink>
    </nav>
  );
}

/**
 * At either end of the list this renders a `<span>` rather than an
 * `aria-disabled` link: crawlers still follow an `<a>` without an `href`, and a
 * link to page 0 is junk in the logs.
 */
function PageLink({
  href,
  rel,
  disabled,
  children,
}: {
  href: string;
  rel: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    // `text-muted-foreground` rather than fading the normal color with
    // `opacity-30`: at 30% the label landed on #b3b3b3, 2.1:1 against the
    // surface — unreadable, and axe fails the story over it. The muted token is
    // what "present but inactive" is supposed to look like here, and it holds
    // 5.8:1.
    return <span className="text-muted-foreground">{children}</span>;
  }

  return (
    <Link
      href={href}
      rel={rel}
      className="rounded-md border border-border px-3 py-1.5 transition-colors hover:bg-muted"
    >
      {children}
    </Link>
  );
}
