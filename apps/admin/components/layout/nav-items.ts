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
  | "items.storybook"
  | "items.posts"
  | "items.conversations"
  | "items.reports"
  | "items.categories"
  | "items.slugs"
  | "items.new"
  | "items.qa"
  | "items.qaDatasets"
  | "items.qaSets"
  | "items.qaItems"
  | "items.qaTemplates"
  | "items.qaCredentials"
  | "items.qaOutlines";

export type NavReasonKey = "disabled.conversations" | "disabled.reports";

export type NavItem = {
  href: string;
  labelKey: NavLabelKey;
  disabled?: boolean;
  /** Why it is locked, shown as a tooltip. */
  reasonKey?: NavReasonKey;
  /**
   * A capability the account must hold for the item to appear at all. Absent
   * means everyone who got past the auth gate sees it.
   */
  requires?: "canGenerateAi";
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
  /*
   * Access control for the internal Storybook, which lives on another domain
   * entirely (`storybook-noalhub.duckdns.org/internal/`). It sits in this
   * sidebar rather than there because Storybook is a static build with no idea
   * who is looking at it — the list it is gated by lives in this backend.
   */
  /*
   * Q&A: four screens for `admin` plus one for `super_admin`. The last one is
   * hidden — not disabled — when the account cannot generate: an `admin` has no
   * reason to see a page that answers 403 to every request on it. Hiding is UX;
   * the backend still refuses.
   */
  {
    href: "/qa/datasets",
    labelKey: "items.qa",
    children: [
      { href: "/qa/sets", labelKey: "items.qaSets" },
      { href: "/qa/items", labelKey: "items.qaItems" },
      { href: "/qa/templates", labelKey: "items.qaTemplates" },
      {
        href: "/qa/credentials",
        labelKey: "items.qaCredentials",
        requires: "canGenerateAi",
      },
    ],
  },
  { href: "/storybook", labelKey: "items.storybook" },
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
 * Labels keyed by the segment itself — the breadcrumb's FIRST lookup layer,
 * ahead of the nav and the "Detail" fallback.
 *
 * `/posts/new` is the archetype: a route with a real name that no sidebar entry
 * points at, where letting the breadcrumb say "Detail" would read as some
 * individual post — plainly wrong.
 */
export const SEGMENT_LABEL_KEYS: Record<string, NavLabelKey> = {
  new: "items.new",
  outlines: "items.qaOutlines",
  /*
   * `qa` and `datasets` are here rather than resolved from the nav because the
   * sidebar's Q&A entry points at `/qa/datasets` under the label "Q&A": read
   * off the nav, the trail comes out as "qa / Q&A" — the group segment raw and
   * the leaf named after its parent.
   */
  qa: "items.qa",
  datasets: "items.qaDatasets",
};

/**
 * Segments that group routes but have no `page.tsx` of their own —
 * `/qa/datasets/[id]/outlines` exists only to nest `[outlineId]` under the
 * dataset, and `/qa` only to group the five Q&A screens. The breadcrumb must
 * show them as plain text: a link there is a 404.
 */
export const NON_ROUTE_SEGMENTS: ReadonlySet<string> = new Set(["outlines", "qa"]);
