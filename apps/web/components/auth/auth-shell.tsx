'use client'

import {useGSAP} from '@gsap/react'
import {Link} from '@noalhub/i18n/navigation'
import gsap from 'gsap'
import {useTranslations} from 'next-intl'
import {useRef} from 'react'

import {HomeField} from '@/components/home/home-field'
import {WebLanguageSwitcher} from '@/components/layout/language-switcher'
import {LogoLockup} from '@noalhub/ui/logo-lockup'
import {AuthFrame} from '@noalhub/ui/auth/auth-frame'
import {ThemeToggle} from '@noalhub/ui/theme/theme-toggle'

gsap.registerPlugin(useGSAP)

const FEATURES = ['chat', 'practice', 'blog'] as const

/**
 * The frame shared by every sign-in / sign-up / reset screen, in the language of
 * the home page: the coloured field (`HomeField`) with one large `Panel` on it.
 *
 * From `lg` up the panel is split. The brand side is the louder half: the
 * tagline set large in the serif, the three things Noalhub does, and the home
 * hero's harbour lithograph wiped in from left to right behind them (the same
 * `--reveal` mask as the hero, `.auth-sketch` in `globals.css`). The form side stays
 * quiet: a serif heading, then the fields rising in one after another. Below `lg`
 * the brand side drops away and the form takes the panel. The form side's top row carries the brand mark and,
 * on the right, the theme and language switches.
 *
 * With reduced motion the drawing is simply there and the form does not travel.
 * With no script the start state never applies (it is `scripting: enabled` only).
 *
 * A client component because of GSAP. Chat is not in here on purpose — it needs
 * the exact viewport height and has its own layout.
 */
export function AuthShell({children}: {children: React.ReactNode}) {
  const t = useTranslations('web.auth.shell')
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const motion = gsap.matchMedia()

      motion.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({defaults: {ease: 'expo.out'}})
        tl.from('[data-auth="form"] > div > *', {
          y: 20,
          opacity: 0,
          duration: 0.9,
          stagger: 0.08,
        })
          .fromTo(
            '[data-auth="sketch"]',
            {'--reveal': '-15%'},
            {'--reveal': '100%', duration: 2.6, ease: 'power2.inOut'},
            0.1,
          )
          .from(
            '[data-auth="line"]',
            {yPercent: 40, opacity: 0, duration: 1, stagger: 0.12},
            0.15,
          )
          .from(
            '[data-auth="feature"]',
            {x: -16, opacity: 0, duration: 0.8, stagger: 0.1},
            0.7,
          )
      })

      motion.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-auth="sketch"]', {'--reveal': '100%'})
      })
    },
    {scope: root},
  )

  return (
    <AuthFrame
      rootRef={root}
      field={<HomeField />}
      logo={
        <Link href="/" aria-label="Noalhub" className="w-fit">
          <LogoLockup className="text-title-3" />
        </Link>
      }
      tools={
        <>
          <ThemeToggle />
          <WebLanguageSwitcher compact />
        </>
      }
      tagline={t('tagline')}
      features={FEATURES.map((key) => t(`features.${key}`))}
      copyright={`© ${new Date().getFullYear()} Noalhub`}>
      {children}
    </AuthFrame>
  )
}
