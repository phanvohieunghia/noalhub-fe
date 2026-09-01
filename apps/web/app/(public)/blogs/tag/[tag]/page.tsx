import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BLOG_PAGE_SIZE, getBlogTag, getPublishedPosts } from "@noalhub/api/blog/server";
import { listCanonical } from "@noalhub/core/blog/seo";
import { PaginationLinks } from "@noalhub/ui/pagination-links";

import { Breadcrumb } from "@/components/blog/breadcrumb";
import { isPageOutOfRange, readPageParam } from "@/components/blog/page-param";
import { PostList } from "@/components/blog/post-list";
import { Typography } from "@noalhub/ui/typography";

type Props = {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Trang thẻ — **`noindex, follow`**, không vào sitemap, không lên nav
 * (`docs/blog-plan.md` §2.6, §6.5).
 *
 * Vẫn đặt canonical dù noindex: hai chỉ thị trả lời hai câu hỏi khác nhau, và
 * canonical còn được các công cụ khác dùng.
 *
 * KHÔNG có `generateStaticParams` (và cũng không có `export const revalidate`):
 * số thẻ không kiểm soát được, pre-render hết là kéo dài build cho một tập trang
 * mà Google không index — và trang có phân trang nên nó đọc `searchParams`, thứ
 * không đi cùng tĩnh hoá được (xem ghi chú dài ở trang chuyên mục). Cache nằm ở
 * tầng `fetch` với tag `blog-tag:<slug>`.
 */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { tag: slug } = await params;
  const page = readPageParam((await searchParams).page) ?? 1;

  const tag = await getBlogTag(slug).catch(() => undefined);
  if (!tag) return { title: "Thẻ", robots: { index: false, follow: true } };

  return {
    title: page > 1 ? `#${tag.name} — Trang ${page}` : `#${tag.name}`,
    description: `Các bài viết gắn thẻ ${tag.name}.`,
    alternates: { canonical: listCanonical(`/blogs/tag/${slug}`, page) },
    robots: { index: false, follow: true },
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { tag: slug } = await params;
  const page = readPageParam((await searchParams).page);
  if (page === null) notFound();

  const tag = await getBlogTag(slug);
  if (!tag) notFound();

  const list = await getPublishedPosts({ page, limit: BLOG_PAGE_SIZE, tag: slug });
  if (isPageOutOfRange(page, list.total, list.limit)) notFound();

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb
        items={[
          { label: "Blog", href: "/blogs" },
          { label: "Thẻ", href: "/blogs/tag" },
          { label: `#${tag.name}` },
        ]}
      />

      <header className="flex flex-col gap-2">
        <Typography variant="h3" as="h1">
          #{tag.name}
        </Typography>
      </header>

      <PostList posts={list.items} emptyMessage="Chưa có bài viết nào gắn thẻ này." />

      <PaginationLinks
        basePath={`/blogs/tag/${slug}`}
        page={list.page}
        limit={list.limit}
        total={list.total}
        label={`Phân trang thẻ ${tag.name}`}
      />
    </div>
  );
}
