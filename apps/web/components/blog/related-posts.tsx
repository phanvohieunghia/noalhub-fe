import Link from "next/link";

import type { BlogPostListItem } from "@noalhub/api/blog";
import { formatDate } from "@noalhub/core/format-date";

/**
 * Khối "Bài liên quan" cuối mỗi bài — 3 bài **cùng chuyên mục**.
 *
 * Lọc theo chuyên mục chứ không theo thẻ: mỗi bài có đúng một chuyên mục nên đây
 * là truy vấn xác định, còn `tags` là **tập không có thứ tự** — "thẻ đầu tiên"
 * chỉ là thẻ nào người viết gõ trước (`docs/blog-plan.md` §2.5, §2.6).
 */
export function RelatedPosts({ posts }: { posts: BlogPostListItem[] }) {
  // Bài duy nhất trong chuyên mục thì không có gì để hiện — bỏ hẳn khối, đừng
  // để một tiêu đề trống lơ lửng.
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="border-t border-black/10 pt-8 dark:border-white/15">
      <h2 id="related-heading" className="text-sm font-medium uppercase tracking-wide opacity-60">
        Bài liên quan
      </h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id} className="flex flex-col gap-1">
            <Link href={`/blogs/${post.slug}`} className="font-medium leading-snug hover:underline">
              {post.title}
            </Link>
            <time dateTime={post.publishedAt} className="text-xs opacity-60">
              {formatDate(post.publishedAt)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
