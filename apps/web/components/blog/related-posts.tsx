import { Link } from "@noalhub/i18n/navigation";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useTranslations } from "next-intl";

import type { BlogPostListItem } from "@noalhub/api/blog";
import { Typography } from "@noalhub/ui/typography";

/**
 * The "Related posts" block at the end of each post — 3 posts from the **same
 * category**.
 *
 * Filtered by category rather than tag: each post has exactly one category,
 * making this a deterministic query, while `tags` is an **unordered set** — the
 * "first tag" is merely whichever the author typed first (`docs/blog.md` §2.5,
 * §2.6).
 */
export function RelatedPosts({ posts }: { posts: BlogPostListItem[] }) {
  const t = useTranslations("web.blog.post");
  const df = useDateFormat();

  // The only post in a category has nothing to show — drop the whole block
  // rather than leaving an empty heading hanging.
  if (posts.length === 0) return null;

  return (
    <section
      aria-labelledby="related-heading"
      className="border-t border-black/10 pt-8 dark:border-white/15"
    >
      <Typography
        variant="title-4"
        as="h2"
        id="related-heading"
        className="uppercase tracking-wide opacity-60"
      >
        {t("relatedHeading")}
      </Typography>
      <ul className="mt-4 grid gap-4 sm:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id} className="flex flex-col gap-1">
            <Link href={`/blogs/${post.slug}`} className="font-medium leading-snug hover:underline">
              {post.title}
            </Link>
            <time dateTime={post.publishedAt} className="text-body-4 opacity-60">
              {df.date(post.publishedAt)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
