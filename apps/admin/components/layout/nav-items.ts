/**
 * The single source of truth for admin navigation — the sidebar and the
 * breadcrumb read this same array, or the two drift apart on the first rename.
 *
 * `disabled` marks a screen whose contract the backend does not have yet
 * (`docs/admin-plan.md` §3). Showing the item but locking it is deliberate:
 * hiding it means someone asks "where is the conversations section?" at every
 * review, while making it clickable leads to a 404.
 */
/**
 * `labelKey`/`reasonKey` are **keys** under `nav.admin.*`, not words: this is an
 * app-level module loaded once at import time and it knows no locale
 * (`docs/i18n.md` §7.3). The sidebar and breadcrumb translate at render time.
 */
/**
 * A union rather than `string`: that way `t(labelKey)` is type-checked and a
 * mistyped key is a compile error instead of odd text in the sidebar (§9).
 */
export type NavLabelKey =
  | "items.overview"
  | "items.users"
  | "items.posts"
  | "items.conversations"
  | "items.reports"
  | "items.categories"
  | "items.new";

export type NavReasonKey = "disabled.conversations" | "disabled.reports";

export type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  disabled?: boolean;
  /** Why it is locked, shown as a tooltip. */
  reasonKey?: NavReasonKey;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/overview", labelKey: "items.overview" },
  { href: "/users", labelKey: "items.users" },
  { href: "/posts", labelKey: "items.posts" },
  {
    href: "/conversations",
    labelKey: "items.conversations",
    disabled: true,
    reasonKey: "disabled.conversations",
  },
  {
    href: "/reports",
    labelKey: "items.reports",
    disabled: true,
    reasonKey: "disabled.reports",
  },
];

/**
 * Labels for segments that are NOT nav items — the breadcrumb's second lookup
 * layer, before falling back to "Detail".
 *
 * `/posts/categories` is the archetype: it deliberately stays out of the
 * sidebar (a screen used a few times a year, entered from inside `/posts` —
 * `docs/blog.md` §7.1), but letting the breadcrumb say "Detail" would read as
 * some individual post, which is plainly wrong.
 */
export const SEGMENT_LABEL_KEYS: Record<string, NavLabelKey> = {
  categories: "items.categories",
  new: "items.new",
};
