import type { MetadataRoute } from "next";

import { getBlogCategories, getBlogSitemapEntries } from "@noalhub/api/blog/server";
import { absoluteUrl } from "@noalhub/core/blog/seo";
import { DEFAULT_LOCALE, LOCALES } from "@noalhub/i18n/config";

/**
 * **Built at runtime, not at build time.**
 *
 * `sitemap.ts` is prerendered during `next build` by default, and at that point
 * `API_INTERNAL_URL` does not exist and the production backend may be
 * unreachable from CI (§4.4a). The measured outcome during a smoke test: **an
 * empty sitemap for up to an hour after every deploy**, unnoticed because the
 * build stayed green.
 *
 * `force-dynamic` drops that prerender entirely. Backend load is unchanged: the
 * `fetch` in `server.ts` still caches for 3600 seconds and still carries the
 * `blog-sitemap` tag, so the §5.2 webhook can still invalidate it — only the XML
 * assembly is redone per request, and that costs next to nothing.
 */
export const dynamic = "force-dynamic";

/**
 * The sitemap contains: `/blogs`, each post, and each category (§6.3).
 *
 * It does NOT contain:
 * - `?page=N` — Google follows the pagination links itself (§4.5), and each
 *   listing page is near-duplicate content.
 * - **tag** pages — tags are `noindex, follow` (§2.6); putting a noindex URL in
 *   the sitemap sends contradictory signals.
 * - `/` — the home page is still behind `AuthGuard`, see `robots.ts`.
 *
 * Since i18n, **each URL appears once per locale**, with an
 * `alternates.languages` block cross-referencing the other (`docs/i18n.md` §8).
 * Listing only one locale leaves the other reachable for indexing only by
 * crawling links.
 *
 * The exception is **posts**: they appear in both locales but declare NO
 * `alternates`, because the content is Vietnamese in both (§8.1).
 */

/** `hreflang` for a translated path. `x-default` points at the default locale. */
function languagesFor(path: string) {
  return {
    languages: {
      ...Object.fromEntries(LOCALES.map((locale) => [locale, absoluteUrl(`/${locale}${path}`)])),
      "x-default": absoluteUrl(`/${DEFAULT_LOCALE}${path}`),
    },
  };
}
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [entries, categories] = await Promise.all([
    safe(getBlogSitemapEntries, []),
    safe(getBlogCategories, []),
  ]);

  return LOCALES.flatMap((locale) => [
    {
      url: absoluteUrl(`/${locale}/blogs`),
      lastModified: entries[0]?.updatedAt ? new Date(entries[0].updatedAt) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
      alternates: languagesFor("/blogs"),
    },
    ...categories.map((category) => ({
      url: absoluteUrl(`/${locale}/blogs/category/${category.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: languagesFor(`/blogs/category/${category.slug}`),
    })),
    ...entries.map((entry) => ({
      url: absoluteUrl(`/${locale}/blogs/${entry.slug}`),
      lastModified: new Date(entry.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]);
}

/**
 * A transient backend failure is **left to throw** — a 500 sitemap makes Google
 * retry, while a 200-but-empty sitemap tells Google the site has no URLs left.
 * This function only absorbs the 404 case (`server.ts` already maps that to an
 * empty array) and keeps a tidy signature for `Promise.all`.
 */
async function safe<T>(load: () => Promise<T[]>, fallback: T[]): Promise<T[]> {
  const result = await load();
  return result.length ? result : fallback;
}
