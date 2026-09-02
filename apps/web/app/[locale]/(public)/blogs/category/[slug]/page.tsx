import { DEFAULT_LOCALE, LOCALES } from "@noalhub/i18n/config";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { BLOG_PAGE_SIZE, getBlogCategory, getPublishedPosts } from "@noalhub/api/blog/server";
import { listCanonical, localeAlternates } from "@noalhub/core/blog/seo";
import { PaginationLinks } from "@noalhub/ui/pagination-links";

import { Breadcrumb } from "@/components/blog/breadcrumb";
import { isPageOutOfRange, readPageParam } from "@/components/blog/page-param";
import { PostList } from "@/components/blog/post-list";
import { Typography } from "@noalhub/ui/typography";

type Props = PageProps<"/[locale]/blogs/category/[slug]">;

/**
 * The category page — **the ONLY axis that gets indexed** (`docs/blog.md`
 * §2.6).
 *
 * Categories and tags are both slices of the same set of posts, i.e. near
 * duplicates of each other and of `/blogs`. Indexing both manufactures dozens of
 * thin-content URLs — the classic WordPress disease. Categories win because they
 * are a **fixed set, with descriptions and enough posts**; the number of tags is
 * uncontrolled.
 *
 * ⚠️ **No `generateStaticParams` and no `export const revalidate`**, even though
 * §4.4 files this route under "ISR, revalidate = 300". The reason is a Next
 * constraint rather than a choice: the page is paginated and therefore reads
 * `searchParams`, a request-time API — declaring `generateStaticParams` alongside
 * it makes Next try to statically generate the route and then die with
 * `DYNAMIC_SERVER_USAGE` **at runtime**, not at build time (it really broke
 * during a smoke test).
 *
 * This is exactly the trade §4.5 accepted for `/blogs`, extended to the category
 * page: the route renders per request, but the **cache lives at the `fetch`
 * layer** (`server.ts` sets `revalidate: 60` plus the `blog-category:<slug>`
 * tag), so it does not hit the backend per request and the §5.2 webhook can
 * still clear it.
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = readPageParam((await searchParams).page) ?? 1;
  const t = await getTranslations({ locale, namespace: "web.blog.category" });

  const category = await getBlogCategory(slug).catch(() => undefined);
  if (!category) return { title: t("fallbackTitle"), robots: { index: false } };

  const alternates = localeAlternates(
    `/blogs/category/${slug}`,
    locale,
    LOCALES,
    DEFAULT_LOCALE,
  );

  return {
    title: page > 1 ? t("titleWithPage", { name: category.name, page }) : category.name,
    // A category's `description` is exactly what keeps it from being a thin page (§6.5).
    description: category.description ?? t("metaDescription", { name: category.name }),
    alternates: {
      ...alternates,
      canonical: listCanonical(`/${locale}/blogs/category/${slug}`, page),
    },
    robots: { index: true, follow: true },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("web.blog");

  const page = readPageParam((await searchParams).page);
  if (page === null) notFound();

  // A category that does NOT exist → 404. Quite different from "the category
  // exists but has no posts yet" below: that stays 200, because empty is a valid
  // temporary state (§6.5).
  const category = await getBlogCategory(slug);
  if (!category) notFound();

  const list = await getPublishedPosts({
    page,
    limit: BLOG_PAGE_SIZE,
    category: slug,
  });
  if (isPageOutOfRange(page, list.total, list.limit)) notFound();

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb
        items={[{ label: t("breadcrumb.blog"), href: "/blogs" }, { label: category.name }]}
      />

      <header className="flex flex-col gap-2">
        <Typography variant="h3" as="h1">
          {category.name}
        </Typography>
        {category.description ? (
          <Typography variant="body-3" className="opacity-70">
            {category.description}
          </Typography>
        ) : null}
      </header>

      <PostList posts={list.items} emptyMessage={t("category.empty")} />

      <PaginationLinks
        basePath={`/blogs/category/${slug}`}
        page={list.page}
        limit={list.limit}
        total={list.total}
        label={t("category.pagination", { name: category.name })}
      />
    </div>
  );
}
