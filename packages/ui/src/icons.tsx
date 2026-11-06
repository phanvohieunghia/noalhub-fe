'use client'

import {
  Icon as IconifyIcon,
  addCollection,
  addIcon,
  type IconProps,
} from '@iconify/react/offline'
import {ICON_COLLECTIONS} from './icon-data.generated'
import {canMorph, MorphIcon, type SpringPreset} from './morph-icon'
import {LUCIDE} from './icon-names.generated'

// The project's default icon set: lucide (stroke-based, a good fit for
// Tailwind). Name syntax: "lucide:trash-2".
//
// The whole set is bundled offline via @iconify/react/offline, a build with the
// API client stripped out: an unknown icon name renders nothing instead of
// silently going to the network. Both generated files come from
// `pnpm --filter @noalhub/ui gen:icons`, which reads the installed
// @iconify-json/lucide package; re-run it after bumping that dependency.

for (const collection of ICON_COLLECTIONS) addCollection(collection)

export type {IconProps}

/** Props that only make sense while the icon animates between two icons. */
interface IconMotionProps {
  /** Stroke width of the morphing icon (lucide default is 2). */
  strokeWidth?: number
  /** Overrides the preset's spring; both are needed to take effect. */
  stiffness?: number
  damping?: number
  /** "user" follows the OS reduced-motion setting; "never" (default) always animates. */
  reducedMotion?: 'never' | 'user' | 'always'
  /** Accessible name; without it the icon stays aria-hidden. */
  label?: string
}

export type IconAnimate = 'none' | SpringPreset

type StaticIconProps = IconProps & {animate?: 'none'}
type AnimatedIconProps = Omit<IconProps, 'icon' | 'strokeWidth'> &
  IconMotionProps & {icon: string; animate: SpringPreset}
export type IconComponentProps = StaticIconProps | AnimatedIconProps

const isAnimated = (p: IconComponentProps): p is AnimatedIconProps =>
  !!p.animate && p.animate !== 'none' && canMorph(p.icon)

/**
 * A wrapper around Iconify. Defaults to 1em → scales with the parent's
 * font-size; pass className="size-4" to pin a specific size.
 *
 * `animate` picks how a change of `icon` is drawn: "none" (default) swaps instantly,
 * while a spring preset ("snappy" | "smooth" | "bouncy") morphs the old icon into the
 * new one (see morph-icon.tsx). Motion-only props (strokeWidth, stiffness, damping,
 * reducedMotion, label) are accepted only together with an `animate` preset. Icons that
 * are not stroke geometry (the brand icons) fall back to the instant swap.
 */
export function Icon(props: IconComponentProps) {
  if (isAnimated(props)) {
    const {
      animate,
      icon,
      className = 'size-4',
      stiffness,
      damping,
      strokeWidth,
      reducedMotion,
      label,
    } = props
    return (
      <MorphIcon
        icon={icon}
        size="1em"
        className={className}
        strokeWidth={strokeWidth}
        reducedMotion={reducedMotion}
        label={label}
        spring={
          stiffness !== undefined && damping !== undefined
            ? {stiffness, damping}
            : animate
        }
      />
    )
  }
  const {className = 'size-4', animate: _animate, ...rest} = props
  return (
    <IconifyIcon
      aria-hidden
      className={className}
      {...(rest as StaticIconProps)}
    />
  )
}

/* ---------------------------------------------------------------------------
 * Brand icons registered offline (lucide carries no brand logos)
 * ------------------------------------------------------------------------- */

addIcon('brand:google', {
  width: 24,
  height: 24,
  body: `<path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.4 5.4 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24"/><path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1-.38-2.29c0-.8.14-1.57.38-2.29V6.62H1.29A11.99 11.99 0 0 0 0 12c0 1.94.47 3.77 1.29 5.38z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75"/>`,
})

addIcon('brand:github', {
  width: 24,
  height: 24,
  body: `<path fill="currentColor" d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.8 1.3 3.5 1c.1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/>`,
})

addIcon('brand:x', {
  width: 24,
  height: 24,
  body: `<path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>`,
})

addIcon('brand:linkedin', {
  width: 24,
  height: 24,
  body: `<path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c-.97 0-1.75-.79-1.75-1.76s.78-1.75 1.75-1.75a1.75 1.75 0 0 1 1.75 1.75c0 .97-.78 1.76-1.75 1.76m1.37 9.74V9.89H5.1v8.61h2.73z"/>`,
})

addIcon('brand:instagram', {
  width: 24,
  height: 24,
  body: `<path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>`,
})

addIcon('brand:youtube', {
  width: 24,
  height: 24,
  body: `<path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>`,
})

/* ---------------------------------------------------------------------------
 * Aliases for frequently used icons — switching icon sets later is one edit here.
 * ------------------------------------------------------------------------- */

/**
 * Every lucide icon, by camelCase name — `LUCIDE.bellRing`. Reach for this when
 * ICONS has no entry for what you need; prefer ICONS when it does, since a
 * semantic alias survives swapping the underlying icon.
 */
export {LUCIDE}

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
  panelLeftClose: LUCIDE.panelLeftClose,
  panelLeftOpen: LUCIDE.panelLeftOpen,
  copy: LUCIDE.copy,
  drag: LUCIDE.gripVertical,
  send: LUCIDE.send,
  binoculars: LUCIDE.binoculars,
  // navigation
  chevronDown: LUCIDE.chevronDown,
  chevronRight: LUCIDE.chevronRight,
  chevronLeft: LUCIDE.chevronLeft,
  arrowLeft: LUCIDE.arrowLeft,
  sortNone: LUCIDE.chevronsUpDown,
  sortAsc: LUCIDE.arrowUp,
  sortDesc: LUCIDE.arrowDown,
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
  lock: LUCIDE.lock,
  calendar: LUCIDE.calendar,
  chat: LUCIDE.messageCircle,
  home: LUCIDE.house,
  logout: LUCIDE.logOut,
  settings: LUCIDE.settings,
  sun: LUCIDE.sun,
  moon: LUCIDE.moon,
  monitor: LUCIDE.monitor,
  sunMoon: LUCIDE.sunMoon,
  palette: LUCIDE.palette,
  check: LUCIDE.check,

  // brands (offline)
  google: 'brand:google',
  github: 'brand:github',
  x: 'brand:x',
  linkedin: 'brand:linkedin',
  instagram: 'brand:instagram',
  youtube: 'brand:youtube',
} as const

export type IconName =
  (typeof ICONS)[keyof typeof ICONS] | (typeof LUCIDE)[keyof typeof LUCIDE]
