"use client";

import {
  Icon as IconifyIcon,
  addCollection,
  addIcon,
  type IconProps,
} from "@iconify/react/offline";
import { ICON_COLLECTIONS } from "./icon-data.generated";
import { LUCIDE } from "./icon-names.generated";

// The project's default icon set: lucide (stroke-based, a good fit for
// Tailwind). Name syntax: "lucide:trash-2".
//
// The whole set is bundled offline via @iconify/react/offline, a build with the
// API client stripped out: an unknown icon name renders nothing instead of
// silently going to the network. Both generated files come from
// `pnpm --filter @noalhub/ui gen:icons`, which reads the installed
// @iconify-json/lucide package; re-run it after bumping that dependency.

for (const collection of ICON_COLLECTIONS) addCollection(collection);

export type { IconProps };

/**
 * A wrapper around Iconify. Defaults to 1em → scales with the parent's
 * font-size; pass className="size-4" to pin a specific size.
 */
export function Icon({ className = "size-4", ...props }: IconProps) {
  return <IconifyIcon aria-hidden className={className} {...props} />;
}

/* ---------------------------------------------------------------------------
 * Brand icons registered offline (lucide carries no brand logos)
 * ------------------------------------------------------------------------- */

addIcon("brand:google", {
  width: 24,
  height: 24,
  body: `<path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.4 5.4 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24"/><path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1-.38-2.29c0-.8.14-1.57.38-2.29V6.62H1.29A11.99 11.99 0 0 0 0 12c0 1.94.47 3.77 1.29 5.38z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75"/>`,
});

addIcon("brand:github", {
  width: 24,
  height: 24,
  body: `<path fill="currentColor" d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.8 1.3 3.5 1c.1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/>`,
});

/* ---------------------------------------------------------------------------
 * Aliases for frequently used icons — switching icon sets later is one edit here.
 * ------------------------------------------------------------------------- */

/**
 * Every lucide icon, by camelCase name — `LUCIDE.bellRing`. Reach for this when
 * ICONS has no entry for what you need; prefer ICONS when it does, since a
 * semantic alias survives swapping the underlying icon.
 */
export { LUCIDE };

export const ICONS = {
  // actions
  add: LUCIDE.plus,
  edit: LUCIDE.pencil,
  delete: LUCIDE.trash2,
  save: LUCIDE.check,
  close: LUCIDE.x,
  search: LUCIDE.search,
  filter: LUCIDE.listFilter,
  more: LUCIDE.ellipsis,
  menu: LUCIDE.menu,
  copy: LUCIDE.copy,
  drag: LUCIDE.gripVertical,
  binoculars: LUCIDE.binoculars,
  // navigation
  chevronDown: LUCIDE.chevronDown,
  chevronRight: LUCIDE.chevronRight,
  chevronLeft: LUCIDE.chevronLeft,
  arrowLeft: LUCIDE.arrowLeft,
  sortNone: LUCIDE.chevronsUpDown,
  sortAsc: LUCIDE.arrowUpNarrowWide,
  sortDesc: LUCIDE.arrowDownWideNarrow,
  externalLink: LUCIDE.externalLink,

  // status
  loading: LUCIDE.loaderCircle,
  success: LUCIDE.circleCheck,
  error: LUCIDE.circleAlert,
  info: LUCIDE.info,
  warning: LUCIDE.triangleAlert,

  // domain
  user: LUCIDE.user,
  users: LUCIDE.users,
  post: LUCIDE.fileText,
  category: LUCIDE.folder,
  tag: LUCIDE.tag,
  rss: LUCIDE.rss,
  map: LUCIDE.map,
  image: LUCIDE.image,
  eye: LUCIDE.eye,
  eyeOff: LUCIDE.eyeOff,
  calendar: LUCIDE.calendar,
  chat: LUCIDE.messageCircle,
  logout: LUCIDE.logOut,
  settings: LUCIDE.settings,
  sun: LUCIDE.sun,
  moon: LUCIDE.moon,
  monitor: LUCIDE.monitor,
  palette: LUCIDE.palette,
  check: LUCIDE.check,

  // brands (offline)
  google: "brand:google",
  github: "brand:github",
} as const;

export type IconName =
  | (typeof ICONS)[keyof typeof ICONS]
  | (typeof LUCIDE)[keyof typeof LUCIDE];
