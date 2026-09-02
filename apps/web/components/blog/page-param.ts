import { blogPageParamSchema } from "@noalhub/api/blog";

/**
 * Reads `?page=` on the public listing pages.
 *
 * `null` means an invalid value → the call site must `notFound()`, and must
 * **not** render an empty list with a 200: an empty 200 gets indexed by Google
 * as thin content (`docs/blog.md` §4.5, §6.5).
 *
 * Absent or empty means page 1, not an error — `/blogs`, `/blogs?page=1` and
 * `/blogs?page=` are three URLs with one content, and all three canonicalize to
 * `/blogs`.
 */
export function readPageParam(value: string | string[] | undefined): number | null {
  if (value === undefined || value === "") return 1;
  // `?page=1&page=2` produces an array — do not guess the intent; treat it as a bad URL.
  if (typeof value !== "string") return null;

  const parsed = blogPageParamSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * A `?page` past the last page is also a bad URL. This check is possible thanks
 * to `total` in the envelope (§2.1a) — without it there is no way to tell "page
 * 9 does not exist" from "page 9 happens to be empty".
 *
 * The exception: with a completely empty list (`total === 0`) page 1 is still
 * valid — that is the site's correct state before any posts exist, not an error
 * (§6.5).
 */
export function isPageOutOfRange(page: number, total: number, limit: number): boolean {
  if (total === 0) return page > 1;
  return page > Math.ceil(total / Math.max(1, limit));
}
