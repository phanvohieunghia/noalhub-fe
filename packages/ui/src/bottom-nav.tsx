import {Link} from '@noalhub/i18n/navigation'

import {Icon} from './icons'
import {Typography} from './typography'

export type BottomNavItem = {
  /** Stable id; matched against `activeKey`. */
  key: string
  /** Already translated — the component pins no i18n namespace. */
  label: string
  /** An iconify name, e.g. `ICONS.newspaper`. */
  icon: string
  href: string
  /** Rendered as a non-interactive, dimmed item (e.g. Chat while signed out). */
  disabled?: boolean
}

/**
 * The mobile primary navigation: a row of icon + label items pinned to the
 * bottom of the screen. Intended for narrow viewports only — the caller hides
 * it from `md` up (`className="md:hidden"`), where the header/sidebar takes over.
 *
 * `Link` comes from `@noalhub/i18n/navigation` so hrefs keep the locale prefix.
 */
export function BottomNav({
  items,
  activeKey,
  label,
  className = '',
}: {
  items: BottomNavItem[]
  activeKey?: string
  /** Accessible name of the `<nav>` landmark. */
  label: string
  className?: string
}) {
  return (
    <nav
      aria-label={label}
      className={`flex items-center justify-between border-t border-border bg-surface p-2 ${className}`}>
      {items.map((item) => {
        const active = item.key === activeKey && !item.disabled
        const content = (
          <>
            <Icon icon={item.icon} className="size-6 shrink-0" />
            <Typography
              as="span"
              variant="body-4"
              className="whitespace-nowrap">
              {item.label}
            </Typography>
          </>
        )
        const base =
          'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden'

        // A disabled item is a <span>, not a <Link>: no href to follow or prefetch,
        // and it drops out of the tab order.
        if (item.disabled) {
          return (
            <span
              key={item.key}
              aria-disabled="true"
              className={`${base} cursor-not-allowed text-muted-foreground opacity-40`}>
              {content}
            </span>
          )
        }

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`${base} transition-colors ${
              active
                ? 'text-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}>
            {content}
          </Link>
        )
      })}
    </nav>
  )
}
