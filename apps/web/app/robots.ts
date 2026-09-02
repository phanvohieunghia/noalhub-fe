import type { MetadataRoute } from "next";

import { absoluteUrl } from "@noalhub/core/blog/seo";
import { LOCALES } from "@noalhub/i18n/config";

/**
 * Only the blog area is crawlable.
 *
 * ⚠️ `/` sitting in `disallow` is **deliberate**, not an oversight: the home
 * page is still inside the `(protected)` route group, i.e. behind `AuthGuard` —
 * a crawler there sees a loading screen and is then pushed to `/login`.
 * Allowing such a URL to be indexed hands Google a blank page. Building a public
 * landing page for `/` is its own piece of work; on that day, change this line
 * and `sitemap.ts` together (`docs/blog.md` §6.1).
 */

/** Every route (except `/auth/callback`) now sits behind a locale prefix. */
const PRIVATE_PATHS = [
  "/chat",
  "/friends",
  "/dashboard",
  "/profile",
  "/login",
  "/register",
  "/reset-password",
  "/forgot-password",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // The only public branch, one entry per language.
      allow: LOCALES.map((locale) => `/${locale}/blogs`),
      disallow: [
        "/",
        // Private paths must be listed **per locale**: a bare `/chat` no longer
        // exists, and one `/chat` line does not block `/vi/chat`.
        ...LOCALES.flatMap((locale) => PRIVATE_PATHS.map((path) => `/${locale}${path}`)),
        // `/auth/callback` deliberately sits outside `[locale]` (the OAuth redirect_uri).
        "/auth",
        // The internal webhook (§5.2). nginx already `deny all`s the public
        // path; this line only keeps well-behaved crawlers from trying.
        "/api",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
