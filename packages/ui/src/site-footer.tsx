import {Link} from '@noalhub/i18n/navigation'
import Image from 'next/image'
import type {ReactNode} from 'react'

import {LogoLockup} from './logo-lockup'

const SOCIAL_ICONS: Record<SiteFooterSocial['id'], ReactNode> = {
  x: (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5 fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  linkedin: (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5 fill-current">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  instagram: (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5 fill-current">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  youtube: (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-3.5 fill-current">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
}

export type SiteFooterSocial = {
  id: 'x' | 'linkedin' | 'instagram' | 'youtube'
  href: string
  /** Already translated; the icon itself is decorative. */
  label: string
}

export type SiteFooterColumn = {
  title: string
  links: {
    href: string
    label: string
    /** A plain `<a>` (feeds, sitemap): no locale prefix, full page load. */
    plain?: boolean
  }[]
}

/**
 * The footer shared by all public areas: brand lockup, monospace tagline and
 * social icons on the left, link columns on the right, a hairline divider with
 * the copyright line, and the panoramic mountain scenery that swaps with
 * light/dark and melts into the footer background.
 *
 * All copy and data come from the caller, so the component pins no i18n
 * namespace and does no fetching; `footerEnd` is the slot at the right of the
 * copyright row (the language switcher in the web app).
 */
export function SiteFooter({
  tagline,
  socials,
  columns,
  navLabel,
  copyright,
  footerEnd,
}: {
  tagline: string
  socials: SiteFooterSocial[]
  columns: SiteFooterColumn[]
  /** Accessible name of the links `<nav>`. */
  navLabel: string
  copyright: string
  footerEnd?: ReactNode
}) {
  return (
    <footer
      id="footer"
      className="relative mt-auto overflow-hidden border-t border-border bg-surface text-foreground">
      {/* Content area: sits above the illustration */}
      <div className="relative z-20 mx-auto flex w-full max-w-7xl flex-col px-6 pt-14 md:px-12 md:pt-16 lg:px-16 xl:px-20">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex max-w-xs flex-col gap-3.5">
            <LogoLockup className="text-title-3" />
            <p className="font-mono text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {tagline}
            </p>
            <div className="flex items-center gap-2 pt-1.5">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex size-7.5 items-center justify-center rounded border border-border bg-surface text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
                  {SOCIAL_ICONS[social.id]}
                </a>
              ))}
            </div>
          </div>

          <nav
            aria-label={navLabel}
            className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4 sm:gap-x-12 lg:gap-x-16">
            {columns.map((column) => (
              <div key={column.title} className="flex flex-col gap-3.5">
                <span className="font-mono text-sm font-semibold tracking-wide text-foreground">
                  {column.title}
                </span>
                <ul className="flex flex-col gap-2.5 text-body-4 text-muted-foreground">
                  {column.links.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      {link.plain ? (
                        <a
                          href={link.href}
                          className="transition-colors hover:text-foreground">
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="transition-colors hover:text-foreground">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Hairline divider & subfooter row */}
        <div className="mt-14 border-t border-border/80 pt-5 md:mt-16">
          <div className="flex flex-col items-center justify-between gap-2 text-center font-mono text-xs text-muted-foreground sm:flex-row sm:text-left">
            <p>
              {copyright}
            </p>
            {footerEnd}
          </div>
        </div>
      </div>

      {/* Seamless scenic illustration banner: melts into footer background */}
      <div className="pointer-events-none relative z-10 -mt-10 w-full overflow-hidden sm:-mt-14 md:-mt-40 lg:-mt-56">
        {/* The footer's own ground laid over the sky, with its lower edge cut into a
            downward point and softened by a blur: the picture shows first at the
            sides and last in the middle, instead of fading along a straight line.
            It overshoots the box on three sides so the blur (wide and soft: `blur-3xl`) never shows an edge
            there (the wrapper clips it). */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-48 -top-32 z-10 h-[21rem] blur-3xl sm:h-[23rem] md:h-[22rem] lg:h-[24rem]">
          {/* The blur is on the outer box: a `clip-path` on the same element would
              cut the blurred edge off again. */}
          <div className="size-full bg-surface [clip-path:polygon(0_0,100%_0,100%_50%,50%_100%,0_50%)]" />
        </div>

        {/* Panoramic artwork: pure mountains and sky. Light mode (day/sunset) and Dark mode (starry night).
            A phone crops it to a fixed height; from `md` its height follows the width but is clamped to 300–420px and anchored
            to the top, so a wider screen crops the bottom instead of growing a taller banner. */}
        <Image
          src="/images/footer-mountains-wide.webp"
          alt=""
          aria-hidden
          width={1376}
          height={768}
          loading="lazy"
          className="pointer-events-none relative z-0 block h-80 w-full select-none object-cover object-[center_30%] sm:h-96 sm:object-top md:h-[clamp(300px,30vw,420px)] md:object-top dark:hidden"
        />
        <Image
          src="/images/footer-mountains-night.webp"
          alt=""
          aria-hidden
          width={1376}
          height={768}
          loading="lazy"
          className="pointer-events-none relative z-0 hidden h-80 w-full select-none object-cover object-[center_30%] sm:h-96 sm:object-top md:h-[clamp(300px,30vw,420px)] md:object-top dark:block"
        />
      </div>
    </footer>
  )
}
