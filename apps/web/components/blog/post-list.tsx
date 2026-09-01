import type { BlogPostListItem } from "@noalhub/api/blog";

import { PostCard } from "./post-card";

/**
 * Lưới bài + **trạng thái rỗng có chữ**.
 *
 * Danh sách rỗng vẫn là **200**, không phải 404: chưa có bài nào (hoặc chuyên
 * mục vừa tạo chưa có bài) là trạng thái hợp lệ tạm thời của site, không phải
 * URL sai. Chỉ chuyên mục/thẻ **không tồn tại** mới `notFound()`
 * (`docs/blog-plan.md` §6.5).
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
      <p className="rounded-lg border border-dashed border-black/15 px-4 py-12 text-center text-sm opacity-60 dark:border-white/20">
        {emptyMessage}
      </p>
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
