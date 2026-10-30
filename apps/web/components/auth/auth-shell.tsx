'use client'

import {useTranslations} from 'next-intl'

import {AuroraBackground} from '@noalhub/ui/aurora-background'
import {Icon, LUCIDE} from '@noalhub/ui/icons'
import {Logo} from '@noalhub/ui/logo'
import {Typography} from '@noalhub/ui/typography'

const FEATURES = [
  {key: 'chat', icon: LUCIDE.messageCircle},
  {key: 'practice', icon: LUCIDE.graduationCap},
  {key: 'blog', icon: LUCIDE.newspaper},
] as const

function BrandMark({light}: {light?: boolean}) {
  return (
    <span className="flex items-center gap-3">
      <Logo
        className={`size-10 shadow-lg shadow-brand-950/40 ${light ? 'dark' : ''}`}
      />
      <Typography
        as="span"
        variant="title-2"
        className={`tracking-tight ${light ? 'text-brand-50' : 'text-foreground'}`}>
        Noalhub
      </Typography>
    </span>
  )
}

/**
 * The frame shared by every sign-in / sign-up / reset screen.
 *
 * From `lg` up it is a split screen: a brand panel (the aurora, the mark, what
 * Noalhub is for) on the left and the form on the right. Below `lg` the panel
 * folds into a short banner above the form, so a phone gets the brand without
 * spending half the screen on it.
 *
 * A client component: it passes `LUCIDE.*` names into `Icon`, and those names live
 * in a `"use client"` module — read from a Server Component they would be client
 * references, not strings, and every icon would render empty.
 *
 * Chat is not in here on purpose — it needs the exact viewport height and has its
 * own layout; this shell is only for the `(auth)` route group.
 */
export function AuthShell({children}: {children: React.ReactNode}) {
  const t = useTranslations('web.auth.shell')

  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Desktop hero panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden p-12 text-brand-50 lg:flex">
        <AuroraBackground />
        <div className="relative">
          <BrandMark light />
        </div>

        <div className="relative max-w-md space-y-8">
          <Typography variant="h2">{t('tagline')}</Typography>
          <ul className="space-y-4">
            {FEATURES.map(({key, icon}) => (
              <li key={key} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50/10 ring-1 ring-brand-50/20 backdrop-blur-sm">
                  <Icon icon={icon} className="size-5 text-brand-300" />
                </span>
                <Typography
                  as="span"
                  variant="body-2"
                  className="pt-1.5 text-brand-100">
                  {t(`features.${key}`)}
                </Typography>
              </li>
            ))}
          </ul>
        </div>

        <Typography variant="body-4" className="relative text-brand-300">
          © {new Date().getFullYear()} Noalhub
        </Typography>
      </aside>

      <div className="flex flex-col">
        {/* Mobile / tablet banner */}
        <div className="relative overflow-hidden px-6 py-6 lg:hidden">
          <AuroraBackground />
          <div className="relative">
            <BrandMark light />
          </div>
        </div>

        <main className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
    </div>
  )
}
