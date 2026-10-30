'use client'

import {useTranslations} from 'next-intl'

import {Badge} from '@noalhub/ui/badge'
import {Icon, ICONS, LUCIDE} from '@noalhub/ui/icons'
import {LogoLockup} from '@noalhub/ui/logo-lockup'
import {Typography} from '@noalhub/ui/typography'

/** Optional: admin is a separate origin, so the public site's URL is config. */
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL

/**
 * The frame around the sign-in card: a quiet muted canvas with concentric rings
 * behind a single centred card. Deliberately NOT the split aurora screen web
 * uses — this one is a staff door, not a landing page (Figma `Admin ·
 * Authentication`).
 *
 * A client component for the same reason as web's `AuthShell`: `LUCIDE.*` names
 * live in a `"use client"` module.
 */
export function LoginShell({children}: {children: React.ReactNode}) {
  const t = useTranslations('admin.login')

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden bg-muted">
      {/* Decorative rings, centred on the viewport. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="absolute size-[520px] rounded-full border border-border sm:size-[720px]" />
        <div className="absolute hidden size-[1080px] rounded-full border border-border sm:block" />
      </div>

      <header className="relative flex items-center justify-between px-4 py-4 sm:px-10 sm:py-6">
        <div className="flex items-center gap-3">
          <LogoLockup />
          <span aria-hidden className="h-5 w-px bg-border" />
          <Badge>{t('badge')}</Badge>
        </div>
        {WEB_URL ? (
          <a
            href={WEB_URL}
            className="hidden items-center gap-2 text-body-3 text-muted-foreground transition-colors hover:text-foreground sm:flex">
            <Icon icon={ICONS.arrowLeft} className="size-4" />
            {t('backToWebsite')}
          </a>
        ) : null}
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-2 sm:px-10 sm:py-4">
        <div className="w-full max-w-[440px] rounded-xl border border-border bg-surface p-6 shadow-[0_8px_24px_rgb(0_0_0/0.06)] sm:p-8">
          {children}
          <Typography
            variant="body-4"
            as="div"
            className="mt-6 flex items-center gap-2 border-t border-border pt-6 text-muted-foreground">
            <Icon icon={LUCIDE.lock} className="size-4 shrink-0" />
            {t('note')}
          </Typography>
        </div>
      </main>

      <Typography
        variant="body-4"
        as="footer"
        className="relative py-4 text-center text-muted-foreground sm:py-6">
        {t('footer')}
      </Typography>
    </div>
  )
}
