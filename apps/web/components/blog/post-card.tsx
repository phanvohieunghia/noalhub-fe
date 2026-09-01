import Image from "next/image";
import Link from "next/link";

import type { BlogPostListItem } from "@noalhub/api/blog";
import { formatReadingTime } from "@noalhub/core/blog/reading-time";
import { listItemDescription } from "@noalhub/core/blog/seo";
import { formatDate } from "@noalhub/core/format-date";
import { Typography } from "@noalhub/ui/typography";

/**
 * Thẻ bài trong danh sách.
 *
 * `readingMinutes` đến từ **backend** chứ không tính ở đây: list item cố tình
 * không có `content` lẫn `contentText` để 20 bài không nặng vài trăm KB, nên FE
 * không có gì để tính (`docs/blog-plan.md` §2.3a).
 */
export function PostCard({ post }: { post: BlogPostListItem }) {
  return (
    <article className="flex flex-col gap-3">
      {post.coverImageUrl ? (
        <Link href={`/blogs/${post.slug}`} tabIndex={-1} aria-hidden className="block">
          <span className="relative block aspect-[16/9] overflow-hidden rounded-lg bg-black/5 dark:bg-white/5">
            <Image
              src={post.coverImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 380px"
            />
          </span>
        </Link>
      ) : null}

      <div className="flex flex-col gap-2">
        <Link
          href={`/blogs/category/${post.category.slug}`}
          className="w-fit text-body-4 font-medium uppercase tracking-wide opacity-60 hover:underline hover:opacity-100"
        >
          {post.category.name}
        </Link>

        {/* h2: trang danh sách chỉ có MỘT h1 là tiêu đề trang (§6.2). */}
        <Typography variant="h5" as="h2" className="leading-snug">
          <Link href={`/blogs/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </Typography>

        <Typography variant="body-3" className="leading-relaxed opacity-75">
          {listItemDescription(post)}
        </Typography>

        <Typography
          variant="body-4"
          className="flex flex-wrap items-center gap-x-2 gap-y-1 opacity-60"
        >
          <span>{post.author.displayName}</span>
          <span aria-hidden>·</span>
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span aria-hidden>·</span>
          <span>{formatReadingTime(post.readingMinutes)}</span>
        </Typography>
      </div>
    </article>
  );
}
