import { DEFAULT_LOCALE, LOCALES } from "@noalhub/i18n/config";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { BLOG_PAGE_SIZE, getPublishedPosts } from "@noalhub/api/blog/server";
import { listCanonical, localeAlternates } from "@noalhub/core/blog/seo";
import { PaginationLinks } from "@noalhub/ui/pagination-links";

import { Breadcrumb } from "@/components/blog/breadcrumb";
import { isPageOutOfRange, readPageParam } from "@/components/blog/page-param";
import { PostList } from "@/components/blog/post-list";
import { Typography } from "@noalhub/ui/typography";

type Props = PageProps<"/[locale]/blogs">;

/**
 * The listing lives at `/blogs` itself, paginated through the **query
 * string**
 * (`docs/blog.md` §4.5).
 *
 * Why not `/blogs/list`: that would be a STATIC segment beside `/blogs/[slug]`,
 * and Next always lets a static segment beat a dynamic one — a post whose slug
 * is `list` would be permanently unopenable. Keeping the listing at `/blogs`
 * itself creates no forbidden slugs.
 *
 * An accepted consequence, NOT a misconfiguration: touching `searchParams` makes
 * Next drop static generation, so the page renders per request. That is offset
 * by caching at the **`fetch` layer** (`server.ts` sets `revalidate: 60` plus
 * the `blog-list` tag), so the page renders per request without hitting the
 * backend per request, and the §5.2 webhook can still clear the
 * cache qua `revalidateTag`.
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const page = readPageParam((await searchParams).page) ?? 1;
  const t = await getTranslations({ locale, namespace: "web.blog.list" });

  const alternates = localeAlternates("/blogs", locale, LOCALES, DEFAULT_LOCALE);

  return {
    title: page > 1 ? t("titleWithPage", { page }) : t("title"),
    description: t("metaDescription"),
    alternates: {
      ...alternates,
      // Pagination has to keep `?page=` in the canonical, so page 2 onwards uses
      // its own canonical instead of `localeAlternates`' query-less version.
      canonical: listCanonical(`/${locale}/blogs`, page),
      // There is only ONE feed, in Vietnamese (§8) — point straight at it rather
      // than sending feed readers through the old path's redirect.
      types: { "application/rss+xml": `/${DEFAULT_LOCALE}/blogs/rss.xml` },
    },
  };
}

export default async function BlogListPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("web.blog");

  const page = readPageParam((await searchParams).page);
  if (page === null) notFound();

  const list = await getPublishedPosts({ page, limit: BLOG_PAGE_SIZE });

  // `?page=99` with only 2 pages is a wrong URL, not an empty list — an empty
  // 200 gets indexed as thin content (§4.5).
  if (isPageOutOfRange(page, list.total, list.limit)) notFound();

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb items={[{ label: t("breadcrumb.blog") }]} />

      <header className="flex flex-col gap-2">
        <Typography variant="h3" as="h1">
          {t("list.title")}
        </Typography>
        <Typography variant="body-3" className="opacity-70">
          {t("list.subtitle")}
        </Typography>
      </header>

      <PostList posts={list.items} emptyMessage={t("list.empty")} />

      <PaginationLinks
        basePath="/blogs"
        page={list.page}
        limit={list.limit}
        total={list.total}
        label={t("list.pagination")}
      />
    </div>
  );
}
