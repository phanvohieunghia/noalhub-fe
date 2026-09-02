import "server-only";

import { API_BASE_URL, apiBaseUrlFrom } from "../config";
import {
  blogCategoryListSchema,
  blogPostListSchema,
  blogPostSchema,
  blogSitemapEntryListSchema,
  blogTagListSchema,
} from "./schemas";
import type {
  BlogCategory,
  BlogPost,
  BlogPostList,
  BlogPostListItem,
  BlogPostQuery,
  BlogSitemapEntry,
  BlogTag,
} from "./types";

/**
 * The blog feature's fourth layer: the **server-only** read path, running in
 * `apps/web`'s Server Components. Parallel to `api.ts`, not a replacement.
 *
 * The four constraints below are all technical, not preferences
 * (`docs/data-layer.md` §7.1, `docs/blog.md` §4.2):
 *
 * 1. **`import "server-only"` on the first line.** An accidental import from a
 *    client component then fails at build time rather than at runtime.
 * 2. **Plain `fetch`, NOT `client.ts`'s `http` (axios).** Next only wires
 *    cache/ISR into its own `fetch`; going through axios loses
 *    `next: { revalidate, tags }` entirely — the page refetches on every
 *    request, ISR becomes meaningless, and the build stays green so nobody
 *    notices. On top of that `client.ts` drags in the token store (zustand,
 *    `localStorage`), which does not exist on the server.
 * 3. **Still `schema.parse`, like the api layer.** Without the response
 *    interceptor the validation has to happen here; otherwise a backend shape
 *    change breaks the public pages with no one the wiser.
 * 4. **404 must stay distinguishable**: single-record readers return `null` on
 *    404 so the route can call `notFound()`; **every other error throws** for
 *    `error.tsx` to handle. Swap the two and either Google drops real posts
 *    from the index because the API blipped once, or Google keeps retrying a
 *    URL that does not exist (§6.4).
 */

/* --------------------------------- Cache tag -------------------------------- */

/**
 * Tag names — the ONLY source of truth, shared with `POST /api/revalidate`
 * (§5.2). That route handler **builds the tag names itself** from the slug it
 * receives rather than taking tag names from the body; it calls the very
 * functions below, so the two cannot drift.
 *
 * Why only `revalidateTag` and never `revalidatePath`: `/blogs` and
 * `/blogs?page=2` are **two different paths**, so `revalidatePath("/blogs")`
 * never touches page 2, while one tag covers all of them.
 */
export const BLOG_TAGS = {
  list: "blog-list",
  categories: "blog-categories",
  tags: "blog-tags",
  sitemap: "blog-sitemap",
  post: (slug: string) => `blog-post:${slug}`,
  category: (slug: string) => `blog-category:${slug}`,
  tag: (slug: string) => `blog-tag:${slug}`,
} as const;

/**
 * Posts per public page (§4.5). The backend's ceiling is 50; this number also
 * defines "past the last page" on `/blogs`, so do not let it differ between
 * call sites.
 */
export const BLOG_PAGE_SIZE = 10;

/** Related posts fetch 4, drop the current post, and show 3 (§2.5). */
const RELATED_FETCH_LIMIT = 4;
const RELATED_DISPLAY_COUNT = 3;

const LIST_REVALIDATE = 60;
const DETAIL_REVALIDATE = 300;
const TAXONOMY_REVALIDATE = 3600;

/* ---------------------------------- Fetch ---------------------------------- */

/** A non-404 failure on the public read path. `/blogs`'s `error.tsx` catches it (§6.4). */
export class BlogServerError extends Error {
  readonly status: number;

  constructor(status: number, path: string) {
    super(`Failed to read blog data (${status}) from ${path}`);
    this.name = "BlogServerError";
    this.status = status;
  }
}

/**
 * The base URL for fetching **on the server**.
 *
 * `NEXT_PUBLIC_API_BASE_URL` is inlined at build time and points at the public
 * domain; if the Next container used it, the request would go out to the
 * internet, round through nginx and come back to the same machine.
 * `API_INTERNAL_URL` is a **runtime** variable (no `NEXT_PUBLIC_`) pointing
 * straight at the backend service inside the docker network (§4.3).
 *
 * Read inside the function rather than at module scope: the value only exists
 * at runtime, not during `next build` on a CI runner — and falling back to the
 * public URL there is the correct behaviour (§4.4a).
 */
function serverApiBaseUrl(): string {
  const internal = process.env.API_INTERNAL_URL;
  return internal ? apiBaseUrlFrom(internal) : API_BASE_URL;
}

type FetchOptions = {
  params?: Record<string, string | number | undefined>;
  tags: string[];
  revalidate: number;
};

/**
 * `next` is Next's addition to the Web API's `RequestInit` — it is only typed
 * when `next/types/global.d.ts` is loaded, and this package **deliberately does
 * not depend on `next`** (it is the data layer, usable outside React and
 * outside Next).
 *
 * So the shape is redeclared here instead of pulling `next` into
 * `devDependencies`. Runtime is unaffected: Next has patched `fetch` and it
 * reads `init.next` directly.
 */
type NextFetchInit = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
};

/**
 * Returns `null` on 404 and throws `BlogServerError` on every other status —
 * see constraint (4) at the top of this file.
 */
async function getJson(
  path: string,
  { params, tags, revalidate }: FetchOptions,
): Promise<unknown | null> {
  const url = new URL(`${serverApiBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  // Assigned through a typed variable rather than passing an object literal:
  // TS's excess-property check would reject the literal, since the base
  // `RequestInit` has no `next`.
  const init: NextFetchInit = {
    headers: { Accept: "application/json" },
    next: { revalidate, tags },
  };

  const response = await fetch(url, init);

  if (response.status === 404) return null;
  if (!response.ok) throw new BlogServerError(response.status, path);

  return response.json();
}

/* ----------------------------------- Posts --------------------------------- */

/**
 * `GET /blog/posts` — `published` posts only, sorted `publishedAt DESC`
 * (filtered on the backend, not the frontend).
 *
 * Every call carries the `blog-list` tag; filtering by category or tag adds
 * that slice's own tag, so the §5.2 webhook invalidates exactly what it should.
 */
export async function getPublishedPosts(
  query: BlogPostQuery = {},
): Promise<BlogPostList> {
  // An explicit type: `BLOG_TAGS` is `as const`, so inference would produce a
  // literal `"blog-list"[]` array that no other tag could be pushed into.
  const tags: string[] = [BLOG_TAGS.list];
  if (query.category) tags.push(BLOG_TAGS.category(query.category));
  if (query.tag) tags.push(BLOG_TAGS.tag(query.tag));

  const data = await getJson("/blog/posts", {
    params: {
      page: query.page,
      limit: query.limit ?? BLOG_PAGE_SIZE,
      category: query.category,
      tag: query.tag,
    },
    tags,
    revalidate: LIST_REVALIDATE,
  });

  // A listing has no legitimate 404 case: `?category=does-not-exist` is a
  // backend or contract bug, not "this page does not exist". The route already
  // verified the category/tag exists via `getBlogCategory`/`getBlogTag` (§6.5).
  if (data === null) throw new BlogServerError(404, "/blog/posts");

  return blogPostListSchema.parse(data);
}

/**
 * `GET /blog/posts/{slug}` — `null` when it does not exist **or is not
 * published** (the backend does not distinguish the two: distinguishing them
 * would open a channel for probing draft slugs, §2.1).
 *
 * ⚠️ The returned post may carry a **different slug** than the one asked for:
 * the backend consults the `blog_post_slugs` table, so old URLs still resolve,
 * but the body holds the new slug (§2.4). The call site must compare
 * `post.slug !== slug` and `permanentRedirect` — otherwise two URLs share one
 * content and old backlinks consolidate nowhere.
 */
export async function getPublishedPost(slug: string): Promise<BlogPost | null> {
  const data = await getJson(`/blog/posts/${encodeURIComponent(slug)}`, {
    // Tagged by the slug that was ASKED FOR: on a slug change the webhook sends
    // both the old and the new slug (§5.2b), so the copy cached under the old
    // URL is invalidated too.
    tags: [BLOG_TAGS.post(slug)],
    revalidate: DETAIL_REVALIDATE,
  });

  return data === null ? null : blogPostSchema.parse(data);
}

/**
 * Related posts — reusing `GET /blog/posts`, with **no** extra endpoint (§2.5).
 *
 * Filtered by **category** rather than tag: each post has exactly one category,
 * making this a deterministic query, whereas the contract promises nothing
 * about the order of `tags`. Four are fetched to compensate for dropping the
 * current post — otherwise every post would show only 2.
 */
export async function getRelatedPosts(
  categorySlug: string,
  excludeSlug: string,
): Promise<BlogPostListItem[]> {
  const { items } = await getPublishedPosts({
    category: categorySlug,
    limit: RELATED_FETCH_LIMIT,
  });

  return items
    .filter((item) => item.slug !== excludeSlug)
    .slice(0, RELATED_DISPLAY_COUNT);
}

/** The latest few posts — used by `/blogs`'s `not-found.tsx` (§2.5, §6.4). */
export async function getLatestPosts(limit = 3): Promise<BlogPostListItem[]> {
  const { items } = await getPublishedPosts({ limit });
  return items;
}

/* --------------------------- Categories and tags --------------------------- */

/**
 * `GET /blog/categories` — `postCount` counts only `published` posts (§2.1).
 * Used by the public layout's nav and by the category pages.
 */
export async function getBlogCategories(): Promise<BlogCategory[]> {
  const data = await getJson("/blog/categories", {
    tags: [BLOG_TAGS.categories],
    revalidate: TAXONOMY_REVALIDATE,
  });
  if (data === null) return [];

  return blogCategoryListSchema
    .parse(data)
    .slice()
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "vi"));
}

/**
 * One category by slug. There is no dedicated endpoint and none is needed: the
 * category list is a small set already cached under the `blog-categories` tag,
 * so looking it up there is cheaper than a new endpoint to maintain forever.
 *
 * `undefined` means the category does not exist → the route calls `notFound()`
 * (§6.5).
 */
export async function getBlogCategory(
  slug: string,
): Promise<BlogCategory | undefined> {
  const categories = await getBlogCategories();
  return categories.find((category) => category.slug === slug);
}

/** `GET /blog/tags` — the tag index at `/blogs/tag`. NOT used for the sitemap (§2.6). */
export async function getBlogTags(): Promise<BlogTag[]> {
  const data = await getJson("/blog/tags", {
    tags: [BLOG_TAGS.tags],
    revalidate: TAXONOMY_REVALIDATE,
  });
  if (data === null) return [];

  return blogTagListSchema
    .parse(data)
    .slice()
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name, "vi"));
}

export async function getBlogTag(slug: string): Promise<BlogTag | undefined> {
  const tags = await getBlogTags();
  return tags.find((tag) => tag.slug === slug);
}

/**
 * `GET /blog/sitemap-entries` — **every** published post, unpaginated.
 *
 * Its own endpoint rather than `GET /blog/posts?limit=…`: once the post count
 * passes the limit the sitemap would **silently miss URLs** while the build
 * stayed green, so nobody would notice (§2.1).
 */
export async function getBlogSitemapEntries(): Promise<BlogSitemapEntry[]> {
  const data = await getJson("/blog/sitemap-entries", {
    tags: [BLOG_TAGS.sitemap],
    revalidate: TAXONOMY_REVALIDATE,
  });
  if (data === null) return [];

  return blogSitemapEntryListSchema.parse(data);
}
