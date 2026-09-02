import type { Locale } from "./config";

/**
 * The namespace list. One namespace = **one route group**, not one component
 * (`docs/i18n.md` §5). Chat has two dozen components but is a single page, so
 * it gets a single namespace.
 *
 * The file on disk is `web.auth.json`, but in the message tree it lives at
 * `web.auth` — the dot is a **path**, not part of the key. That is what makes
 * `useTranslations("web.auth")` behave like any other nested namespace.
 */
export const NAMESPACES = [
  "common",
  "nav",
  "validation",
  "web.auth",
  "web.blog",
  "web.chat",
  "web.friends",
  "web.profile",
  "web.dashboard",
  "admin.overview",
  "admin.posts",
  "admin.users",
  "admin.login",
] as const;

export type Namespace = (typeof NAMESPACES)[number];

/**
 * The namespaces **every** route loads. Keep this list short: it ships in every
 * page's payload, including the static blog pages.
 */
export const SHARED_NAMESPACES = [
  "common",
  "nav",
  "validation",
] as const satisfies readonly Namespace[];

/**
 * Path prefix → the namespace owned by that route group. Matched **longest
 * prefix first**, so the order of this array is meaningful.
 */
const WEB_ROUTES: ReadonlyArray<readonly [string, Namespace]> = [
  ["/blogs", "web.blog"],
  ["/chat", "web.chat"],
  ["/friends", "web.friends"],
  ["/profile", "web.profile"],
  ["/dashboard", "web.dashboard"],
  ["/login", "web.auth"],
  ["/register", "web.auth"],
  ["/forgot-password", "web.auth"],
  ["/reset-password", "web.auth"],
  ["/auth", "web.auth"],
];

const ADMIN_ROUTES: ReadonlyArray<readonly [string, Namespace]> = [
  ["/posts", "admin.posts"],
  ["/users", "admin.users"],
  ["/login", "admin.login"],
];

function matchPrefix(
  routes: ReadonlyArray<readonly [string, Namespace]>,
  pathname: string,
): Namespace | null {
  for (const [prefix, namespace] of routes) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return namespace;
    }
  }
  return null;
}

/**
 * The namespaces to load for an `apps/web` request.
 *
 * `pathname` must already have the locale prefix **stripped** — call
 * `stripLocale` first if you are holding the raw request path.
 *
 * This is the whole reason namespaces exist: splitting them but still loading
 * everything would leave the blog page downloading all of chat's strings (§5).
 */
export function webNamespaces(pathname: string): readonly Namespace[] {
  const route = matchPrefix(WEB_ROUTES, pathname);
  return route ? [...SHARED_NAMESPACES, route] : [...SHARED_NAMESPACES];
}

/** Same as above, for `apps/admin`. The root `/` is the overview. */
export function adminNamespaces(pathname: string): readonly Namespace[] {
  const route = matchPrefix(ADMIN_ROUTES, pathname) ?? "admin.overview";
  return [...SHARED_NAMESPACES, route];
}

/** `/en/blogs/x` → `/blogs/x`. A path without a prefix is returned unchanged. */
export function stripLocale(pathname: string, locales: readonly Locale[]): string {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}
