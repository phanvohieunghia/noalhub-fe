import { getPublishedPosts } from "@noalhub/api/blog/server";
import { absoluteUrl } from "@noalhub/core/blog/seo";
import { DEFAULT_LOCALE } from "@noalhub/i18n/config";
import { getTranslations } from "next-intl/server";

/**
 * Same reason as `sitemap.ts`: the build-time prerender produces an **empty
 * feed** until `revalidate` elapses after each deploy (measured during a smoke
 * test). Caching still happens at the `fetch` layer under the `blog-list` tag,
 * so the backend takes no extra calls.
 */
export const dynamic = "force-dynamic";

/** Still used for the `Cache-Control` header sent to the CDN/nginx. */
const FEED_MAX_AGE = 3600;

const FEED_SIZE = 20;

/**
 * A **summary** feed: `<description>` carries only the `excerpt`, never the
 * full post
 * (`docs/blog.md` §6.6).
 *
 * This is where the plan contradicted itself, and the contradiction was
 * resolved: `rss.xml` is an XML string and therefore needs **escaped HTML
 * strings**, while §3 settled that "no path emits raw HTML" and the renderer in
 * `packages/ui/src/blog/post-content.tsx` returns React elements.
 *
 * Writing a `postContentToHtml()` to fill that gap rebuilds exactly the
 * HTML-emitting path §3 removed — hand-rolled escaping, a hand-rolled node map,
 * kept in sync with the React renderer forever, and one escaping mistake is XSS
 * inside someone else's reader. A summary feed is a familiar standard and costs
 * nothing: `excerpt` is always there
 * (§2.3b).
 *
 * If a full-content feed is ever genuinely needed, `postContentToHtml()` must
 * live **next to** the renderer in `packages/ui/src/blog/`, sharing one node
 * map — not as a second copy inside this file.
 *
 * **A SINGLE feed, in Vietnamese** (`docs/i18n.md` §8): the post content is not
 * translated, so a second feed would differ only in the channel title while
 * every item stayed identical — two feeds with the same content are a nuisance
 * for readers, not a feature. The route still lives inside `[locale]` (it cannot
 * sit outside, since only `(public)` has the blog layout), but
 * `/en/blogs/rss.xml` deliberately returns **the same** Vietnamese feed. The old
 * `/blogs/rss.xml` is 308-redirected to the `vi` version by `next.config.ts`.
 */
export async function GET() {
  // Hardcoded to `vi` rather than reading the request's locale: see the note above.
  const t = await getTranslations({ locale: DEFAULT_LOCALE, namespace: "web.blog.rss" });

  // ⚠️ Same reason as `generateStaticParams` in §4.4a, and this is where it
  // **actually broke**: Next prerenders Route Handlers during `next build`, when
  // `API_INTERNAL_URL` does not exist yet, so `server.ts` calls the production
  // API from the GitHub runner. A backend that cannot answer means **a red
  // frontend build over one RSS file**.
  //
  // §4.4a only mentions `generateStaticParams` because that is the case the plan's
  // author hit, but the rule it states ("the frontend build must not depend on a
  // live backend") applies to EVERY route prerendered at build time. A
  // temporarily empty feed is cheaper than a break in CD, and `revalidate`
  // regenerates it on the next visit.
  const items = await getPublishedPosts({ limit: FEED_SIZE })
    .then((list) => list.items)
    .catch(() => []);

  const feedUrl = absoluteUrl(`/${DEFAULT_LOCALE}/blogs/rss.xml`);
  const siteUrl = absoluteUrl(`/${DEFAULT_LOCALE}/blogs`);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(t("title"))}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(t("description"))}</description>
    <language>${DEFAULT_LOCALE}</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items.map(itemXml).join("\n")}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // The CDN/nginx path should also know how long the feed stays fresh.
      "Cache-Control": `public, max-age=0, s-maxage=${FEED_MAX_AGE}`,
    },
  });
}

function itemXml(post: {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  category: { name: string };
}): string {
  const url = absoluteUrl(`/${DEFAULT_LOCALE}/blogs/${post.slug}`);

  return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <category>${escapeXml(post.category.name)}</category>
      <description>${escapeXml(post.excerpt)}</description>
    </item>`;
}

/**
 * XML's five mandatory characters. `&` must be replaced FIRST, or the later
 * replacements escape the `&` we just produced (`&lt;` becoming `&amp;lt;`).
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
