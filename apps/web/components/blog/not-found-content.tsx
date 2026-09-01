"use client";

import type { BlogPostListItem } from "@noalhub/api/blog";
import { Link } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";

import { PostList } from "./post-list";
import { Typography } from "@noalhub/ui/typography";

/**
 * Phần chữ của trang 404 blog — **là Client Component, và đó là điều bắt buộc**.
 *
 * `not-found.tsx` không nhận `params`, nên mọi API i18n phía server ở đó
 * (`useTranslations` lẫn `getTranslations`) phải đọc request mới biết ngôn ngữ.
 * Chỉ cần một lời gọi như vậy là **cả segment `blogs/` rơi khỏi static
 * rendering**, kể cả `[slug]` — đo được bằng `next build`: `●` biến thành `ƒ`,
 * và nginx mất sạch cache bài viết (`docs/i18n-plan.md` §10).
 *
 * Client Component thì không có vấn đề đó: message đến từ `NextIntlClientProvider`
 * mà `(public)/layout.tsx` đã đặt sẵn, không ai phải hỏi request cả.
 */
export function BlogNotFoundContent({ posts }: { posts: BlogPostListItem[] }) {
  const t = useTranslations("web.blog.notFound");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Typography variant="h3" as="h1">
          {t("title")}
        </Typography>
        <Typography variant="body-3" className="opacity-70">
          {t("message")}
        </Typography>
        <Link href="/blogs" className="w-fit text-body-3 underline underline-offset-4">
          {t("backToList")}
        </Link>
      </header>

      {posts.length > 0 ? (
        <section aria-labelledby="latest-heading" className="flex flex-col gap-4">
          <Typography
            variant="title-4"
            as="h2"
            id="latest-heading"
            className="uppercase tracking-wide opacity-60"
          >
            {t("latestHeading")}
          </Typography>
          <PostList posts={posts} emptyMessage="" />
        </section>
      ) : null}
    </div>
  );
}
