import {ICONS, LUCIDE} from '@noalhub/ui/icons'

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
  | 'items.overview'
  | 'items.users'
  | 'items.storybook'
  | 'items.posts'
  | 'items.conversations'
  | 'items.reports'
  | 'items.categories'
  | 'items.slugs'
  | 'items.new'
  | 'items.qa'
  | 'items.qaDatasets'
  | 'items.qaSets'
  | 'items.qaItems'
  | 'items.qaTags'
  | 'items.qaTemplates'
  | 'items.qaCredentials'
  | 'items.qaModels'
  | 'items.qaOutlines'
  | 'items.ai'
  | 'items.edit'

export type NavReasonKey =
  'disabled.conversations' | 'disabled.reports' | 'disabled.requiresSuperAdmin'

export type NavItem = {
  href: string
  labelKey: NavLabelKey
  /** An iconify name for top-level rows. Children are drawn without one. */
  icon?: string
  disabled?: boolean
  /** Why it is locked, shown as a tooltip. */
  reasonKey?: NavReasonKey
  /**
   * A capability the account must hold for the item to be usable. Without it
   * the item is still shown, but locked. Absent means everyone who got past the
   * auth gate can use it.
   */
  requires?: 'canGenerateAi'
  /**
   * Sub-screens of this section, rendered indented under it. One level only —
   * a second would be a menu, and this sidebar has five sections.
   */
  children?: NavItem[]
}

export const NAV_ITEMS: NavItem[] = [
  {href: '/overview', labelKey: 'items.overview', icon: LUCIDE.layoutDashboard},
  {href: '/users', labelKey: 'items.users', icon: ICONS.users},
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
    href: '/posts',
    labelKey: 'items.posts',
    icon: LUCIDE.newspaper,
    children: [
      {href: '/posts', labelKey: 'items.posts'},
      {href: '/posts/categories', labelKey: 'items.categories'},
      {href: '/posts/slugs', labelKey: 'items.slugs'},
    ],
  },
  /*
   * Access control for the internal Storybook, which lives on another domain
   * entirely (`storybook-noalhub.duckdns.org/internal/`). It sits in this
   * sidebar rather than there because Storybook is a static build with no idea
   * who is looking at it — the list it is gated by lives in this backend.
   */
  /*
   * Q&A is the content the learner sees: datasets, the question sets generated
   * from them, and the bank that searches across all of it.
   */
  {
    href: '/qa/datasets',
    labelKey: 'items.qa',
    icon: LUCIDE.circleQuestionMark,
    children: [
      {href: '/qa/datasets', labelKey: 'items.qaDatasets'},
      {href: '/qa/sets', labelKey: 'items.qaSets'},
      {href: '/qa/items', labelKey: 'items.qaItems'},
      {href: '/qa/tags', labelKey: 'items.qaTags'},
    ],
  },
  /*
   * Prompts and AI keys are how questions get generated, not what they are, so
   * they are their own section instead of two more rows under Q&A. The routes
   * stay under `/qa/*` — the screens did not move, only where the sidebar files
   * them — which is why the breadcrumb still reads "Q&A / Prompts".
   *
   * The AI keys row is shown but disabled when the account cannot generate:
   * an `admin` sees it is there and why it is locked. The backend still refuses.
   */
  {
    href: '/qa/templates',
    labelKey: 'items.ai',
    icon: LUCIDE.sparkles,
    children: [
      {href: '/qa/templates', labelKey: 'items.qaTemplates'},
      {
        href: '/qa/credentials',
        labelKey: 'items.qaCredentials',
        requires: 'canGenerateAi',
      },
      {
        href: '/qa/models',
        labelKey: 'items.qaModels',
        requires: 'canGenerateAi',
      },
    ],
  },
  {href: '/storybook', labelKey: 'items.storybook', icon: ICONS.palette},
  {
    href: '/conversations',
    labelKey: 'items.conversations',
    icon: LUCIDE.messagesSquare,
    disabled: true,
    reasonKey: 'disabled.conversations',
  },
  {
    href: '/reports',
    labelKey: 'items.reports',
    icon: LUCIDE.flag,
    disabled: true,
    reasonKey: 'disabled.reports',
  },
]

/** Every item, parents and children alike — for lookups by href. */
export const FLAT_NAV_ITEMS: NavItem[] = NAV_ITEMS.flatMap((item) => [
  item,
  ...(item.children ?? []),
])

/**
 * Labels keyed by the segment itself — the breadcrumb's FIRST lookup layer,
 * ahead of the nav and the "Detail" fallback.
 *
 * `/posts/new` is the archetype: a route with a real name that no sidebar entry
 * points at, where letting the breadcrumb say "Detail" would read as some
 * individual post — plainly wrong.
 */
export const SEGMENT_LABEL_KEYS: Record<string, NavLabelKey> = {
  new: 'items.new',
  edit: 'items.edit',
  outlines: 'items.qaOutlines',
  items: 'items.qaItems',
  /*
   * `qa` and `datasets` are here rather than resolved from the nav because the
   * sidebar's Q&A entry points at `/qa/datasets` under the label "Q&A": read
   * off the nav, the trail comes out as "qa / Q&A" — the group segment raw and
   * the leaf named after its parent.
   */
  qa: 'items.qa',
  datasets: 'items.qaDatasets',
}

/**
 * Segments that group routes but have no `page.tsx` of their own —
 * `/qa/datasets/[id]/outlines` exists only to nest `[outlineId]` under the
 * dataset, and `/qa` only to group the five Q&A screens. The breadcrumb must
 * show them as plain text: a link there is a 404.
 */
export const NON_ROUTE_SEGMENTS: ReadonlySet<string> = new Set([
  'outlines',
  'qa',
])
