import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { getBlogSitemapEntries, getPublishedPost, getRelatedPosts } from "@noalhub/api/blog/server";
import { formatReadingTime, readingMinutes } from "@noalhub/core/blog/reading-time";
import {
  absoluteUrl,
  postMetaDescription,
  postMetaTitle,
  postOgImage,
} from "@noalhub/core/blog/seo";
import { formatDate } from "@noalhub/core/format-date";
import { PostContent } from "@noalhub/ui/blog/post-content";
import { TableOfContents } from "@noalhub/ui/blog/table-of-contents";

import { Breadcrumb } from "@/components/blog/breadcrumb";
import { JsonLd } from "@/components/blog/json-ld";
import { RelatedPosts } from "@/components/blog/related-posts";
import { Typography } from "@noalhub/ui/typography";

type Props = { params: Promise<{ slug: string }> };

/** Webhook §5.2 xoá tag sớm hơn; con số này là lưới an toàn khi webhook lỡ. */
export const revalidate = 300;

/**
 * ⚠️ `generateStaticParams` **không được phép làm đỏ build**.
 *
 * `publish.yml` build image trên GitHub runner và chỉ truyền `NEXT_PUBLIC_*`;
 * `API_INTERNAL_URL` là biến runtime của compose nên lúc build **không tồn tại**
 * → `server.ts` rơi về URL công khai và `next build` sẽ gọi API production từ
 * runner. Backend sập, đang deploy, hay DuckDNS trục trặc đúng lúc đó là build
 * FE đỏ — với lỗi hiện ra ở một feature không liên quan gì tới bài viết
 * (`docs/blog-plan.md` §4.4a).
 *
 * Đổi lại gần như không mất gì: mỗi lần deploy là container mới, ISR cache rỗng,
 * nên pre-render lúc build chỉ tiết kiệm lượt truy cập **đầu tiên** của mỗi bài
 * sau mỗi lần deploy. `dynamicParams` mặc định `true` nên bài không có trong
 * danh sách vẫn render on-demand rồi cache.
 */
export async function generateStaticParams() {
  try {
    const entries = await getBlogSitemapEntries();
    return entries.map((entry) => ({ slug: entry.slug }));
  } catch {
    return [];
  }
}

/**
 * ⚠️ Phải tự `try/catch`: `error.tsx` là error boundary ở client nên nó **không**
 * bắt được lỗi ở đây — lỗi trong `generateMetadata` làm hỏng cả route (§6.4).
 * Trả metadata tối thiểu và để hàm page bên dưới quyết định 404 hay 500.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const post = await getPublishedPost(slug).catch(() => null);
  if (!post) return { title: "Bài viết", robots: { index: false } };

  const description = postMetaDescription(post);
  const ogImage = postOgImage(post);

  return {
    title: postMetaTitle(post),
    description,
    alternates: {
      // `canonicalUrl` chỉ được set khi bài đăng lại từ nguồn khác (§2.3).
      canonical: post.seo.canonicalUrl ?? `/blogs/${post.slug}`,
    },
    robots: { index: !post.seo.noindex, follow: true },
    openGraph: {
      type: "article",
      title: postMetaTitle(post),
      description,
      url: `/blogs/${post.slug}`,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: [post.author.displayName],
      // `article:section` là số ít, `article:tag` là số nhiều — đúng hình dạng
      // hai trục: một chuyên mục, nhiều thẻ (§2.6, §6.2).
      section: post.category?.name,
      tags: post.tags.map((tag) => tag.name),
      locale: "vi_VN",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);

  // 404 = không tồn tại HOẶC chưa publish. Backend cố tình không phân biệt hai
  // ca đó, nếu không đây là kênh dò slug bài nháp (§2.1).
  if (!post) notFound();

  // Slug cũ: backend tra bảng `blog_post_slugs` và vẫn trả bài, nhưng body mang
  // slug MỚI. Chuyển hướng vĩnh viễn sang URL chính để backlink cũ dồn về một
  // chỗ (§2.4).
  //
  // Lưu ý mã trạng thái: `permanentRedirect` của Next trả **308**, không phải
  // 301 như §2.4 viết. Đừng "sửa" lại — Next không cho chọn mã, và Google nói rõ
  // 308 được xử lý y hệt 301 (khác biệt duy nhất là 308 giữ nguyên HTTP method,
  // thứ không liên quan gì tới một trang đọc bằng GET).
  if (post.slug !== slug) permanentRedirect(`/blogs/${post.slug}`);

  const related = post.category
    ? await getRelatedPosts(post.category.slug, post.slug).catch(() => [])
    : [];

  const minutes = readingMinutes(post.contentText);

  return (
    <article className="flex flex-col gap-8">
      <Breadcrumb
        items={[
          { label: "Blog", href: "/blogs" },
          ...(post.category
            ? [{ label: post.category.name, href: `/blogs/category/${post.category.slug}` }]
            : []),
          { label: post.title },
        ]}
      />

      <header className="flex flex-col gap-4">
        {/* Đúng MỘT <h1> mỗi trang; heading trong nội dung là h2/h3 (§6.2). */}
        <Typography variant="h2" as="h1" className="leading-tight">
          {post.title}
        </Typography>

        <Typography
          variant="body-3"
          className="flex flex-wrap items-center gap-x-2 gap-y-1 opacity-60"
        >
          <span>{post.author.displayName}</span>
          <span aria-hidden>·</span>
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          ) : null}
          <span aria-hidden>·</span>
          <span>{formatReadingTime(minutes)}</span>
        </Typography>

        {post.coverImageUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-black/5 dark:bg-white/5">
            {/* `priority`: ảnh bìa gần như luôn là LCP của trang bài viết. */}
            <Image
              src={post.coverImageUrl}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        ) : null}
      </header>

      <TableOfContents doc={post.content} />

      <PostContent doc={post.content} />

      {post.tags.length > 0 ? (
        <section aria-labelledby="tags-heading" className="flex flex-wrap items-center gap-2">
          <Typography variant="h2" id="tags-heading" className="sr-only">
            Thẻ
          </Typography>
          {post.tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/blogs/tag/${tag.slug}`}
              className="rounded-full bg-black/8 px-3 py-1 text-body-4 opacity-80 transition-opacity hover:opacity-100 dark:bg-white/12"
            >
              #{tag.name}
            </Link>
          ))}
        </section>
      ) : null}

      <RelatedPosts posts={related} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: postMetaDescription(post),
          datePublished: post.publishedAt ?? post.updatedAt,
          dateModified: post.updatedAt,
          author: { "@type": "Person", name: post.author.displayName },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": absoluteUrl(`/blogs/${post.slug}`),
          },
          ...(postOgImage(post) ? { image: [postOgImage(post)] } : {}),
          ...(post.category ? { articleSection: post.category.name } : {}),
          ...(post.tags.length ? { keywords: post.tags.map((tag) => tag.name).join(", ") } : {}),
          wordCount: post.contentText.trim().split(/\s+/).filter(Boolean).length,
        }}
      />
    </article>
  );
}
