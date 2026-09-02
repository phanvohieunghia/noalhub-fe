import type { BlogPostListItem } from "@noalhub/api/blog";

import { PostCard } from "./post-card";
import { Typography } from "@noalhub/ui/typography";

/**
 * The post grid plus **an empty state with words in it**.
 *
 * An empty list is still a **200**, not a 404: having no posts yet (or a
 * freshly created category with none) is a valid temporary state of the site,
 * not a bad URL. Only a category or tag that **does not exist** calls
 * `notFound()` (`docs/blog.md` §6.5).
 */
export function PostList({
  posts,
  emptyMessage,
}: {
  posts: BlogPostListItem[];
  emptyMessage: string;
}) {
  if (posts.length === 0) {
    return (
      <Typography
        variant="body-3"
        className="rounded-lg border border-dashed border-black/15 px-4 py-12 text-center opacity-60 dark:border-white/20"
      >
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
