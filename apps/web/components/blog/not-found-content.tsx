"use client";

import type { BlogPostListItem } from "@noalhub/api/blog";
import { Link } from "@noalhub/i18n/navigation";
import { useTranslations } from "next-intl";

import { PostList } from "./post-list";
import { Typography } from "@noalhub/ui/typography";

/**
 * The text of the blog 404 page — **a Client Component, and that is mandatory**.
 *
 * `not-found.tsx` receives no `params`, so every server-side i18n API there
 * (`useTranslations` as well as `getTranslations`) has to read the request to
 * learn the language. One such call is enough to drop **the entire `blogs/`
 * segment out of static rendering**, `[slug]` included — measurable with
 * `next build`: `●` turns into `ƒ`, and nginx loses every cached post
 * (`docs/i18n.md` §10).
 *
 * A Client Component has no such problem: the messages come from the
 * `NextIntlClientProvider` that `(public)/layout.tsx` already mounted, and
 * nobody has to ask the request.
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
