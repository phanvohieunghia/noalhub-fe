'use client'

import {THEME_MODES, type ThemeMode} from '@noalhub/core/theme/types'
import {useTranslations} from 'next-intl'

import {Icon, ICONS} from '../icons'
import {useTheme} from './theme-provider'

const MODE_ICONS: Record<ThemeMode, string> = {
  light: ICONS.sun,
  dark: ICONS.moon,
  system: ICONS.monitor,
}

/**
 * Three buttons in a group, **not** a two-state toggle: `system` has to be
 * explicitly selectable, and the user has to see which mode they are in — a
 * toggle cannot say "following the system".
 *
 * Drawn like `LanguageSwitcher` (a bordered pill, the chosen option filled with the
 * primary colour) so the two sit together as one family of controls.
 */
export function ThemeToggle({
  className = '',
  modes = THEME_MODES,
}: {
  className?: string
  /** Which modes to offer — defaults to all three. */
  modes?: readonly ThemeMode[]
}) {
  // `common` is the namespace every page of both apps loads — a shared
  // component must not pin one app's namespace (`docs/i18n.md` §6).
  const t = useTranslations('common.theme')
  const {mode, setMode, mounted} = useTheme()

  return (
    <div
      role="group"
      aria-label={t('label')}
      // Before hydration the client does not know which mode is selected (the
      // server cannot read localStorage). All 3 buttons still render so the
      // layout does not shift, but the "selected" marking is hidden — showing
      // it would paint the wrong button first and then jump to the right one.
      className={`inline-flex items-center gap-0.5 rounded-full border border-border p-0.5 ${className}`}>
      {modes.map((value) => {
        const active = mounted && mode === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={active}
            title={t(value)}
            className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Icon icon={MODE_ICONS[value]} className="size-4" />
            <span className="sr-only">{t(value)}</span>
          </button>
        )
      })}
    </div>
  )
}
