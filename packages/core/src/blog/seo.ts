import type { BlogPost, BlogPostListItem } from "@noalhub/api/blog";

/**
 * Pure SEO helpers for the blog — no React, no fetching. Used on **both** sides:
 * `apps/web` builds `generateMetadata` + JSON-LD from them, `apps/admin` builds
 * the Google result preview in the SEO panel (§7.2). Defined once, so the
 * preview in admin cannot lie about what reaches Google.
 */

/**
 * Google's truncation thresholds. A **soft warning** in the editor, never a
 * block on saving — Google truncates by pixels, not characters, so these
 * numbers are an estimate.
 */
export const SEO_LIMITS = { title: 60, description: 155 } as const;

/**
 * The public origin of `apps/web`.
 *
 * ⚠️ `NEXT_PUBLIC_*` is **inlined at build time**, so this variable must appear
 * in the `env:` block of `.github/workflows/publish.yml` and in the
 * Dockerfile's `build-args`. Miss it and every absolute URL (canonical, OG,
 * sitemap, JSON-LD) comes out as `undefined/...` while the build stays green
 * (§6.1).
 */
export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100").replace(
    /\/+$/,
    "",
  );
}

/** Absolute URLs for JSON-LD and RSS — the two places `metadataBase` does not cover. */
export function absoluteUrl(path: string): string {
  return `${appUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function postPath(slug: string): string {
  return `/blogs/${slug}`;
}

export function categoryPath(slug: string): string {
  return `/blogs/category/${slug}`;
}

export function tagPath(slug: string): string {
  return `/blogs/tag/${slug}`;
}

/**
 * The canonical URL of a listing page (§4.5).
 *
 * Page 1 is always `/blogs`, **even when the URL says `?page=1`** — otherwise
 * `?page=1`, `/blogs` and an empty `?page=` are three URLs with one content.
 */
export function listCanonical(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

/** `seo.metaTitle ?? title` (§6.2). */
export function postMetaTitle(post: BlogPost): string {
  return post.seo.metaTitle ?? post.title;
}

/**
 * `seo.metaDescription ?? excerpt` (§6.2).
 *
 * No third fallback is needed: the backend generates `excerpt` from
 * `contentText` on write, so `excerpt` is always there (§2.3b). The `?? ""` is
 * only a net for a backend that has not shipped that part — a post with no
 * description at all is a silent SEO failure.
 */
export function postMetaDescription(post: BlogPost): string {
  return post.seo.metaDescription ?? post.excerpt ?? "";
}

/** `seo.ogImageUrl ?? coverImageUrl`. Returns `null` when there is no image (§6.3). */
export function postOgImage(post: BlogPost): string | null {
  return post.seo.ogImageUrl ?? post.coverImageUrl;
}

/**
 * Truncation for the preview: cut at a **word boundary**, then append `…`.
 * Cutting mid-word makes the preview look worse than reality, and the author
 * ends up fixing the wrong thing.
 */
export function truncateForSeo(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;

  const cut = trimmed.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** The description shown on a post card in a listing. */
export function listItemDescription(item: BlogPostListItem): string {
  return truncateForSeo(item.excerpt, 180);
}

/**
 * Multilingual `alternates` for a public path (`docs/i18n.md` §8).
 *
 * `canonical` points at **the locale being rendered**, not at `vi`: each
 * language version is its own URL, and collapsing the canonical onto one of
 * them tells Google to drop the other.
 *
 * `x-default` points at `vi` — the version for users who match no language in
 * the list.
 *
 * ⚠️ For translated **chrome** only. NOT for post content: posts stay
 * Vietnamese in both locales, and declaring `hreflang` as if a translation
 * existed is an error in Google's eyes (§8.1).
 */
export function localeAlternates(
  path: string,
  locale: string,
  locales: readonly string[],
  defaultLocale: string,
) {
  const languages = Object.fromEntries(locales.map((l) => [l, `/${l}${path}`]));

  return {
    canonical: `/${locale}${path}`,
    languages: { ...languages, "x-default": `/${defaultLocale}${path}` },
  };
}
