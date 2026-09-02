import type { MetadataRoute } from "next";

/**
 * Admin has nothing to index — block everything (`docs/blog.md` §6.1).
 *
 * A supplementary measure, not a fence: the real boundary is still
 * `AuthGuard` + `RoleGuard` + the backend's 403. robots.txt only speaks to
 * well-behaved crawlers; it blocks nobody.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
