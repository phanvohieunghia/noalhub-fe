import type { Metadata } from "next";
import Link from "next/link";

import { getLatestPosts } from "@noalhub/api/blog/server";

import { PostList } from "@/components/blog/post-list";
import { Typography } from "@noalhub/ui/typography";

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
 */
export const metadata: Metadata = {
  title: "Không tìm thấy bài viết",
  robots: { index: false },
};

export default async function BlogNotFound() {
  // Trang 404 không được kéo theo lỗi thứ hai: backend đang sập thì vẫn phải ra
  // được câu "không tìm thấy" + đường về `/blogs`.
  const latest = await getLatestPosts(3).catch(() => []);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Typography variant="h3" as="h1">
          Không tìm thấy bài viết
        </Typography>
        <Typography variant="body-3" className="opacity-70">
          Bài viết này không tồn tại, đã được gỡ, hoặc đường dẫn bị gõ sai.
        </Typography>
        <Link href="/blogs" className="w-fit text-body-3 underline underline-offset-4">
          ← Về danh sách bài viết
        </Link>
      </header>

      {latest.length > 0 ? (
        <section aria-labelledby="latest-heading" className="flex flex-col gap-4">
          <Typography
            variant="title-4"
            as="h2"
            id="latest-heading"
            className="uppercase tracking-wide opacity-60"
          >
            Bài mới nhất
          </Typography>
          <PostList posts={latest} emptyMessage="" />
        </section>
      ) : null}
    </div>
  );
}
