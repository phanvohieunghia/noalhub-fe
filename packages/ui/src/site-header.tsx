import {Link} from '@noalhub/i18n/navigation'
import type {ReactNode} from 'react'

import {LogoLockup} from './logo-lockup'

export type SiteHeaderLink = {href: string; label: string}

/**
 * The web header, in two looks (Figma `Header`):
 *
 * - `app`: the bordered bar inside the product — brand left, links and account right.
 * - `home`: floats over the page glow with no fill or border; brand and account are
 *   `flex-1`, which centres the links from `md` up.
 *
 * Labels and the account slot come from the caller (the account depends on the
 * auth store), so the component pins no i18n namespace. `className` lets the app
 * add its own placement, e.g. `sticky top-0 z-30 hidden md:block`.
 */
export function SiteHeader({
  variant = 'app',
  links,
  navLabel,
  account,
  className = '',
}: {
  variant?: 'app' | 'home'
  links: readonly SiteHeaderLink[]
  /** Accessible name of the links `<nav>`. */
  navLabel: string
  account: ReactNode
  className?: string
}) {
  const brand = (
    <Link href="/" aria-label="Noalhub" className="flex items-center">
      <LogoLockup className="text-title-3" />
    </Link>
  )

  if (variant === 'home') {
    return (
      <header className={`h-14 md:h-16 ${className}`}>
        <div className="mx-auto flex h-full w-full max-w-7xl items-center px-4 md:px-12 lg:px-25">
          <div className="flex flex-1 items-center">{brand}</div>
          <nav
            aria-label={navLabel}
            className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-body-3 text-foreground transition-opacity hover:opacity-70">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-1 items-center justify-end gap-3">
            {account}
          </div>
        </div>
      </header>
    )
  }

  return (
    <header
      className={`h-16 shrink-0 border-b border-border bg-surface ${className}`}>
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 md:px-12">
        {brand}
        <div className="flex items-center gap-4">
          <nav
            aria-label={navLabel}
            className="hidden items-center gap-4 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-title-4 text-muted-foreground transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
          {account}
        </div>
      </div>
    </header>
  )
}
