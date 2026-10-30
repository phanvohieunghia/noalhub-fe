import {Link} from '@noalhub/i18n/navigation'
import {getTranslations} from 'next-intl/server'

import {LogoLockup} from '@noalhub/ui/logo-lockup'
import {Typography} from '@noalhub/ui/typography'

/**
 * The home page footer (Figma `Footer / Home`): a dark aurora panel with a
 * rounded top edge, the brand blurb, the main links and the legal row. A
 * fixed brand surface — text uses the light end of the `brand` scale, as
 * `AuroraBackground` documents.
 */
export async function HomeFooter() {
  const t = await getTranslations('web.home.footer')

  const links = [
    {href: '/blogs', label: t('posts')},
    {href: '/blogs', label: t('categories')},
    {href: '/learn', label: t('practice')},
    {href: '/chat', label: t('messages')},
    {href: '/friends', label: t('friends')},
  ] as const

  return (
    <footer className="relative mt-auto overflow-hidden text-brand-50">
      {/* Figma "Aurora base": a huge ellipse whose top edge makes the arch, graded
          mint → teal → deep teal, plus three blurred glows on the 1280px frame. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-12 left-1/2 h-137.5 w-300 -translate-x-1/2 rounded-[50%] bg-[linear-gradient(to_bottom,var(--color-brand-200)_0%,var(--color-brand-600)_12%,var(--color-brand-800)_40%,var(--color-brand-950)_100%)] lg:top-17.5 lg:h-275 lg:w-600" />
        <div className="absolute top-0 left-1/2 w-320 -translate-x-1/2">
          <div className="absolute top-42.5 -left-30 size-130 rounded-full bg-brand-700/70 blur-[45px]" />
          <div className="absolute top-57.5 left-205 size-140 rounded-full bg-brand-500/55 blur-[45px]" />
          <div className="absolute top-75 left-95 size-105 rounded-full bg-brand-400/35 blur-[45px]" />
        </div>
      </div>
      {/* Oversized wordmark watermark (Figma: 220px, 6% opacity), clipped by the footer's overflow. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[0.3em] left-1/2 -translate-x-1/2 text-[22vw] leading-none font-semibold tracking-tighter whitespace-nowrap opacity-6 select-none lg:text-[220px]">
        Noalhub
      </span>
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-9 px-4 pt-40 pb-8 md:px-12 lg:px-25 lg:pt-42.5">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-85 flex-col gap-3.5">
            <LogoLockup className="dark text-title-3" />
            <Typography variant="body-4" className="opacity-75">
              {t('tagline')}
            </Typography>
          </div>
          <nav className="flex flex-wrap gap-x-5.5 gap-y-2 text-body-3">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center justify-between border-t border-brand-50/20 pt-4 text-body-4 opacity-70">
          <Typography variant="body-4">
            © {new Date().getFullYear()} Noalhub
          </Typography>
          <Typography variant="body-4">
            {t('rss')} · {t('sitemap')}
          </Typography>
        </div>
      </div>
    </footer>
  )
}
