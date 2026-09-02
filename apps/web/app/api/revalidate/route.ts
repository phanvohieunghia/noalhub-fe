import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";

import { BLOG_TAGS } from "@noalhub/api/blog/server";

/** Never cached: this is a command endpoint, not a page. */
export const dynamic = "force-dynamic";

const SLUG_PATTERN = /^[a-z0-9-]+$/;
/** A body with thousands of entries is a DoS lever — each entry is a cache invalidation. */
const MAX_ITEMS_PER_ARRAY = 50;

/**
 * The revalidate webhook — called by the **backend** after a post's status
 * changes
 * (`docs/blog.md` §5.2).
 *
 * ```
 * POST http://web:3000/api/revalidate        (internal to the docker network)
 * x-revalidate-secret: <shared secret>
 * { "slugs": ["bai-viet-abc", "slug-cu"], "categories": ["huong-dan"], "tags": ["react"] }
 * ```
 *
 * ⚠️ **The caller must be the backend, not `apps/admin`.** Admin is code running
 * in a browser — putting the secret there publishes it, and calling without a
 * secret lets anyone spam revalidation. With the backend calling at the exact
 * point it changes `status`, EVERY path that publishes a post (a button, a seed
 * script, a future sync job) triggers revalidation, with none missed.
 *
 * ⚠️ This is an **internal** endpoint: nginx `deny all`s
 * `location = /api/revalidate` in the public server block (§5.2c). The secret is
 * the second layer, not the only one.
 *
 * ⚠️ The ISR cache lives **inside each container**. There is only one `web`
 * container today, so this is fine; the day it scales to 2 replicas one webhook
 * refreshes exactly one of them — at which point a shared cache handler is
 * needed.
 */
export async function POST(request: Request) {
  const secret = process.env.WEB_REVALIDATE_SECRET;
  if (!secret) {
    // Unconfigured means refuse outright rather than leave the door unlocked.
    // The blog is still correct, only slower: the 60-second ISR is the safety
    // net already in place (§5.1).
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  if (!isValidSecret(request.headers.get("x-revalidate-secret"), secret)) {
    // A wrong or missing secret → 401 and NOTHING more is said (§5.2a).
    return new Response(null, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const slugs = readSlugArray(body, "slugs");
  const categories = readSlugArray(body, "categories");
  const tags = readSlugArray(body, "tags");

  if (slugs === null || categories === null || tags === null) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  /**
   * `revalidateTag` only, never `revalidatePath`: `/blogs` and `/blogs?page=2`
   * are two different paths, so `revalidatePath("/blogs")` never touches page 2,
   * while one tag covers all of them (§5.2).
   *
   * The tag names are **built by the web side** from the slugs received — the
   * body carries no tag names and no paths. Otherwise this endpoint becomes a
   * tool for forcing a re-render of any route in the app.
   *
   * `{ expire: 0 }` rather than `"max"`: `"max"` is stale-while-revalidate, so
   * the first F5 after Publish still shows the old version. §5.2's requirement
   * is "press Publish, F5, see it". `updateTag` gives those semantics but only
   * works inside a Server Action, not a Route Handler — so `{ expire: 0 }` is
   * the right form for a webhook, and Next's docs say exactly that.
   */
  const expireNow = { expire: 0 };

  revalidateTag(BLOG_TAGS.list, expireNow);
  revalidateTag(BLOG_TAGS.sitemap, expireNow);
  revalidateTag(BLOG_TAGS.categories, expireNow);
  revalidateTag(BLOG_TAGS.tags, expireNow);

  // `slugs` is PLURAL because a slug change must invalidate both the old and the new (§2.4, §5.2b).
  for (const slug of slugs) revalidateTag(BLOG_TAGS.post(slug), expireNow);
  // Moving a post to another category makes the backend send BOTH the old and
  // the new one; removing a tag likewise, or `/blogs/tag/<old>` keeps listing
  // that post for another 300 seconds.
  for (const slug of categories) revalidateTag(BLOG_TAGS.category(slug), expireNow);
  for (const slug of tags) revalidateTag(BLOG_TAGS.tag(slug), expireNow);

  return Response.json({ revalidated: true, now: Date.now() });
}

/**
 * A **timing-safe** comparison, not `===`.
 *
 * `timingSafeEqual` throws when the buffers differ in length, so the length has
 * to be checked first — and that check itself leaks the secret's length.
 * Acceptable: what must stay hidden is the content, and this endpoint is already
 * blocked from outside by nginx (§5.2c).
 */
function isValidSecret(provided: string | null, expected: string): boolean {
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * `undefined` → an empty array (the field is optional). Returning `null` means
 * a malformed
 * shape → 400.
 */
function readSlugArray(body: unknown, key: string): string[] | null {
  if (typeof body !== "object" || body === null) return null;

  const value = (body as Record<string, unknown>)[key];
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ITEMS_PER_ARRAY) return null;

  // One regex covers all three arrays because post, category and tag slugs share
  // a shape (§2.6). A malformed entry fails the whole request rather than being
  // skipped silently: if the backend sends something wrong it has to be obvious
  // immediately, not a hunt for why the cache never cleared.
  return value.every((item) => typeof item === "string" && SLUG_PATTERN.test(item))
    ? (value as string[])
    : null;
}
