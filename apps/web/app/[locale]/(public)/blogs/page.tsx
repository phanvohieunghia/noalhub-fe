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
 * Danh sách nằm ngay ở `/blogs`, phân trang bằng **query string**
 * (`docs/blog-plan.md` §4.5).
 *
 * Vì sao không `/blogs/list`: đó là segment TĨNH cùng cấp với `/blogs/[slug]`,
 * mà Next luôn cho segment tĩnh thắng segment động — một bài đặt slug `list` sẽ
 * vĩnh viễn không mở được. Để danh sách ở chính `/blogs` thì không sinh ra slug
 * cấm nào.
 *
 * Hệ quả đã chấp nhận, KHÔNG phải cấu hình sai: đụng vào `searchParams` là Next
 * bỏ tĩnh hoá, mỗi request một lần render. Bù lại bằng cache ở **tầng `fetch`**
 * (`server.ts` gắn `revalidate: 60` + tag `blog-list`), nên trang render mỗi
 * request nhưng không đấm vào backend mỗi request, và webhook §5.2 vẫn xoá được
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
      // Phân trang phải giữ được `?page=` trong canonical, nên trang 2 trở đi
      // dùng canonical riêng thay vì bản không query của `localeAlternates`.
      canonical: listCanonical(`/${locale}/blogs`, page),
      // Feed chỉ có MỘT bản, tiếng Việt (§8) — trỏ thẳng vào nó, đừng để trình
      // đọc feed phải đi qua redirect của đường cũ.
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

  // `?page=99` khi chỉ có 2 trang là URL sai, không phải danh sách rỗng — trang
  // 200 rỗng bị index như nội dung mỏng (§4.5).
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
