import type { Metadata } from "next";

import { getLatestPosts } from "@noalhub/api/blog/server";

import { BlogNotFoundContent } from "@/components/blog/not-found-content";

/**
 * The blog area's own 404: the post does not exist, is unpublished, is
 * `archived`, or `?page` is out of range (`docs/blog.md` §6.4).
 *
 * It lives in `blogs/` rather than at the app root: the blog's error page has
 * different content and layout from the chat app's.
 *
 * ⚠️ Do NOT merge this with `error.tsx`. A dead backend answering 404 makes
 * Google **drop real posts from the index** over a single API outage; a
 * nonexistent post answering 500 makes Google retry forever. Two kinds of
 * failure, two files.
 *
 * ⚠️ This file **must not call any server-side i18n API** — the words live in
 * `BlogNotFoundContent` (a client component). The full reasoning is in that
 * component's note; in short: `not-found.tsx` receives no `params`, so asking
 * for the language here means asking the request, and all of `blogs/[slug]`
 * falls out of SSG.
 *
 * For the same reason `metadata` is constant: the title is the root layout's
 * job, and all that is needed here is to block
 * index.
 */
export const metadata: Metadata = { robots: { index: false } };

export default async function BlogNotFound() {
  // The 404 page must not drag a second failure along: with the backend down it
  // still has to render "not found" plus a way back to `/blogs`.
  const latest = await getLatestPosts(3).catch(() => []);

  return <BlogNotFoundContent posts={latest} />;
}
