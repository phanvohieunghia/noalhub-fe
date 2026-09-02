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
  | "items.slugs"
  | "items.new";

export type NavReasonKey = "disabled.conversations" | "disabled.reports";

export type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  disabled?: boolean;
  /** Why it is locked, shown as a tooltip. */
  reasonKey?: NavReasonKey;
  /**
   * Sub-screens of this section, rendered indented under it. One level only —
   * a second would be a menu, and this sidebar has five sections.
   */
  children?: NavItem[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/overview", labelKey: "items.overview" },
  { href: "/users", labelKey: "items.users" },
  /*
   * Blog's two configuration screens sit UNDER "Posts" rather than beside it:
   * both are settings for the same section, used a few times a year. Buried
   * behind a link inside `/posts` they were effectively unfindable — you had to
   * already know they existed.
   *
   * Nesting is why `admin-sidebar` matches on the LONGEST href instead of the
   * first prefix hit: a plain `startsWith` lights up "Posts" on these too.
   */
  {
    href: "/posts",
    labelKey: "items.posts",
    children: [
      { href: "/posts/categories", labelKey: "items.categories" },
      { href: "/posts/slugs", labelKey: "items.slugs" },
    ],
  },
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

/** Every item, parents and children alike — for lookups by href. */
export const FLAT_NAV_ITEMS: NavItem[] = NAV_ITEMS.flatMap((item) => [
  item,
  ...(item.children ?? []),
]);

/**
 * Labels for segments that are NOT nav items — the breadcrumb's second lookup
 * layer, before falling back to "Detail".
 *
 * `/posts/new` is the archetype: a route with a real name that no sidebar entry
 * points at, where letting the breadcrumb say "Detail" would read as some
 * individual post — plainly wrong.
 */
export const SEGMENT_LABEL_KEYS: Record<string, NavLabelKey> = {
  new: "items.new",
};
