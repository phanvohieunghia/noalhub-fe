import type { Metadata } from "next";

import { getLatestPosts } from "@noalhub/api/blog/server";

import { BlogNotFoundContent } from "@/components/blog/not-found-content";

/**
 * 404 của riêng vùng blog: bài không tồn tại, chưa publish, đã `archived`, hoặc
 * `?page` ngoài khoảng (`docs/blog-plan.md` §6.4).
 *
 * Đặt trong `blogs/` chứ không ở root app: nội dung và layout của trang lỗi blog
 * khác trang lỗi của app chat.
 *
 * ⚠️ KHÔNG gộp với `error.tsx`. Backend chết mà trả 404 thì Google **gỡ bài thật
 * khỏi index** chỉ vì một lần API sập; bài không tồn tại mà trả 500 thì Google
 * thử lại mãi. Hai loại lỗi, hai file.
 *
 * ⚠️ File này **không được gọi bất kỳ API i18n phía server nào** — chữ nằm ở
 * `BlogNotFoundContent` (client). Lý do đầy đủ ở chú thích của component đó;
 * tóm tắt: `not-found.tsx` không có `params`, nên hỏi ngôn ngữ ở đây là hỏi
 * request, và cả `blogs/[slug]` rơi khỏi SSG.
 *
 * Cũng vì vậy `metadata` là hằng: tiêu đề để root layout lo, ở đây chỉ cần chặn
 * index.
 */
export const metadata: Metadata = { robots: { index: false } };

export default async function BlogNotFound() {
  // Trang 404 không được kéo theo lỗi thứ hai: backend đang sập thì vẫn phải ra
  // được câu "không tìm thấy" + đường về `/blogs`.
  const latest = await getLatestPosts(3).catch(() => []);

  return <BlogNotFoundContent posts={latest} />;
}
