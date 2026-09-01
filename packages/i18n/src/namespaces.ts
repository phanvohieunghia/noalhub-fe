import type { Locale } from "./config";

/**
 * Danh sách namespace. Một namespace = **một nhóm route**, không phải một
 * component (`docs/i18n-plan.md` §5). Chat có hơn hai chục component nhưng là
 * một trang, nên chỉ có một namespace.
 *
 * Tên file trên đĩa là `web.auth.json`, nhưng trong cây message nó nằm ở
 * `web.auth` — dấu chấm là **đường dẫn**, không phải một phần của khoá. Nhờ vậy
 * `useTranslations("web.auth")` hoạt động như mọi namespace lồng nhau khác.
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
 * Namespace mà **mọi** route đều nạp. Giữ danh sách này ngắn: nó nằm trong
 * payload của từng trang, kể cả trang blog tĩnh.
 */
export const SHARED_NAMESPACES = [
  "common",
  "nav",
  "validation",
] as const satisfies readonly Namespace[];

/**
 * Tiền tố đường dẫn → namespace riêng của nhóm route đó. So khớp theo tiền tố
 * **dài nhất trước**, nên thứ tự trong mảng là có ý nghĩa.
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
 * Namespace cần nạp cho một request của `apps/web`.
 *
 * `pathname` đã **bỏ** tiền tố locale — gọi `stripLocale` trước nếu đang cầm
 * đường dẫn thô từ request.
 *
 * Đây là lý do tồn tại của việc chia namespace: chia mà vẫn nạp hết thì trang
 * blog vẫn phải tải toàn bộ chuỗi của chat (§5).
 */
export function webNamespaces(pathname: string): readonly Namespace[] {
  const route = matchPrefix(WEB_ROUTES, pathname);
  return route ? [...SHARED_NAMESPACES, route] : [...SHARED_NAMESPACES];
}

/** Như trên, cho `apps/admin`. Trang gốc `/` là overview. */
export function adminNamespaces(pathname: string): readonly Namespace[] {
  const route = matchPrefix(ADMIN_ROUTES, pathname) ?? "admin.overview";
  return [...SHARED_NAMESPACES, route];
}

/** `/en/blogs/x` → `/blogs/x`. Đường dẫn không có tiền tố thì giữ nguyên. */
export function stripLocale(pathname: string, locales: readonly Locale[]): string {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}
