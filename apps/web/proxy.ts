import { routing } from "@noalhub/i18n/routing";
import createMiddleware from "next-intl/middleware";

/**
 * As of Next 16, `middleware.ts` is renamed `proxy.ts` — the same mechanism,
 * only a different file name and export name
 * (`docs/01-app/01-getting-started/16-proxy.md`).
 *
 * Its only job: redirect `/` → `/vi`, add the locale prefix to paths that lack
 * one, and set the `NOALHUB_LOCALE` cookie following §4.2's priority order
 * (URL → cookie → `Accept-Language` → `vi`).
 */
export const proxy = createMiddleware(routing);

export const config = {
  /*
   * Exclusions, in order of reason:
   * - `api`, `_next`, `_vercel`: not pages.
   * - `auth/callback`: the `redirect_uri` is pinned in the backend and in the
   *   Google/GitHub consoles. Adding a locale prefix here breaks OAuth sign-in.
   * - Any path containing a dot: static files (`favicon.ico`, `robots.txt`,
   *   `sitemap.xml`, and `blogs/rss.xml` too — there is only one Vietnamese
   *   feed, §8).
   */
  matcher: "/((?!api|_next|_vercel|auth/callback|.*\\..*).*)",
};
