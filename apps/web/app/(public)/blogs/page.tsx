import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BLOG_PAGE_SIZE, getPublishedPosts } from "@noalhub/api/blog/server";
import { listCanonical } from "@noalhub/core/blog/seo";
import { PaginationLinks } from "@noalhub/ui/pagination-links";

import { Breadcrumb } from "@/components/blog/breadcrumb";
import { isPageOutOfRange, readPageParam } from "@/components/blog/page-param";
import { PostList } from "@/components/blog/post-list";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

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
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = readPageParam((await searchParams).page) ?? 1;

  return {
    title: page > 1 ? `Bài viết — Trang ${page}` : "Bài viết",
    description:
      "Bài viết về sản phẩm, kỹ thuật và những thứ chúng tôi học được khi xây Noalhub.",
    alternates: {
      canonical: listCanonical("/blogs", page),
      types: { "application/rss+xml": "/blogs/rss.xml" },
    },
  };
}

export default async function BlogListPage({ searchParams }: Props) {
  const page = readPageParam((await searchParams).page);
  if (page === null) notFound();

  const list = await getPublishedPosts({ page, limit: BLOG_PAGE_SIZE });

  // `?page=99` khi chỉ có 2 trang là URL sai, không phải danh sách rỗng — trang
  // 200 rỗng bị index như nội dung mỏng (§4.5).
  if (isPageOutOfRange(page, list.total, list.limit)) notFound();

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb items={[{ label: "Blog" }]} />

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Bài viết</h1>
        <p className="text-sm opacity-70">
          Ghi chép về sản phẩm, kỹ thuật và những thứ chúng tôi học được khi xây
          Noalhub.
        </p>
      </header>

      <PostList
        posts={list.items}
        emptyMessage="Chưa có bài viết nào được đăng. Quay lại sau nhé."
      />

      <PaginationLinks
        basePath="/blogs"
        page={list.page}
        limit={list.limit}
        total={list.total}
        label="Phân trang danh sách bài viết"
      />
    </div>
  );
}
