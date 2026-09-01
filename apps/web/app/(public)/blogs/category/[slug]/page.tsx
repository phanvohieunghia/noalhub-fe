import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  BLOG_PAGE_SIZE,
  getBlogCategory,
  getPublishedPosts,
} from "@noalhub/api/blog/server";
import { listCanonical } from "@noalhub/core/blog/seo";
import { PaginationLinks } from "@noalhub/ui/pagination-links";

import { Breadcrumb } from "@/components/blog/breadcrumb";
import { isPageOutOfRange, readPageParam } from "@/components/blog/page-param";
import { PostList } from "@/components/blog/post-list";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Trang chuyên mục — **trục DUY NHẤT được index** (`docs/blog-plan.md` §2.6).
 *
 * Chuyên mục và thẻ đều là lát cắt của cùng một tập bài, tức là gần trùng nội
 * dung với nhau và với `/blogs`. Cho index cả hai là tự tạo ra hàng chục URL nội
 * dung mỏng — đúng bệnh kinh điển của WordPress. Chuyên mục thắng vì nó là tập
 * **cố định, có mô tả, đủ bài**; số lượng thẻ thì không kiểm soát được.
 *
 * ⚠️ **Không có `generateStaticParams` và không có `export const revalidate`**,
 * dù §4.4 xếp route này vào nhóm "ISR, revalidate = 300". Lý do là ràng buộc của
 * Next chứ không phải lựa chọn: trang có phân trang nên nó đọc `searchParams`,
 * mà `searchParams` là request-time API — khai `generateStaticParams` cùng lúc
 * làm Next cố tĩnh hoá route rồi chết với `DYNAMIC_SERVER_USAGE` **lúc chạy**,
 * không phải lúc build (đã vỡ thật khi smoke test).
 *
 * Đây đúng là đánh đổi mà §4.5 đã chấp nhận cho `/blogs`, chỉ là nó áp cho cả
 * trang chuyên mục: route render mỗi request, nhưng **cache nằm ở tầng `fetch`**
 * (`server.ts` gắn `revalidate: 60` + tag `blog-category:<slug>`), nên không đấm
 * vào backend mỗi request và webhook §5.2 vẫn xoá được cache.
 */
export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = readPageParam((await searchParams).page) ?? 1;

  const category = await getBlogCategory(slug).catch(() => undefined);
  if (!category) return { title: "Chuyên mục", robots: { index: false } };

  return {
    title: page > 1 ? `${category.name} — Trang ${page}` : category.name,
    // `description` của chuyên mục chính là thứ làm nó KHÔNG phải trang mỏng (§6.5).
    description:
      category.description ?? `Các bài viết trong chuyên mục ${category.name}.`,
    alternates: { canonical: listCanonical(`/blogs/category/${slug}`, page) },
    robots: { index: true, follow: true },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const page = readPageParam((await searchParams).page);
  if (page === null) notFound();

  // Chuyên mục KHÔNG tồn tại → 404. Khác hẳn "chuyên mục tồn tại nhưng chưa có
  // bài" ở dưới: cái đó vẫn 200 vì rỗng là trạng thái hợp lệ tạm thời (§6.5).
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
        items={[{ label: "Blog", href: "/blogs" }, { label: category.name }]}
      />

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{category.name}</h1>
        {category.description ? (
          <p className="text-sm opacity-70">{category.description}</p>
        ) : null}
      </header>

      <PostList
        posts={list.items}
        emptyMessage="Chuyên mục này chưa có bài viết nào."
      />

      <PaginationLinks
        basePath={`/blogs/category/${slug}`}
        page={list.page}
        limit={list.limit}
        total={list.total}
        label={`Phân trang chuyên mục ${category.name}`}
      />
    </div>
  );
}
