'use client'

import {THEME_MODES, type ThemeMode} from '@noalhub/core/theme/types'
import {useTranslations} from 'next-intl'

import {Icon, ICONS} from '../icons'
import {useTheme} from './theme-provider'

const MODE_ICONS: Record<ThemeMode, string> = {
  light: ICONS.sun,
  dark: ICONS.moon,
  system: ICONS.monitor,
  auto: ICONS.sunMoon,
}

/**
 * Collapsed to a single button showing the current mode; hovering (or focusing)
 * the pill opens the other modes sideways. `auto` (by the device clock) is the
 * default when nothing is stored. Four buttons in a group, **not** a two-state toggle: `system` has to be
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

  // The stored mode is unreadable until hydration. Showing the default's icon
  // would paint the wrong mode and then swap it, so show a pulsing placeholder
  // of the same size (the collapsed pill is one 28px button) until it is known.
  if (!mounted) {
    return (
      <div
        role="status"
        aria-label={t('label')}
        aria-busy="true"
        className={`inline-flex items-center rounded-full border border-border p-0.5 ${className}`}>
        <span className="size-7 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
      </div>
    )
  }

  return (
    <div
      role="group"
      aria-label={t('label')}
      // Before hydration the client does not know which mode is selected (the
      // server cannot read localStorage). All 3 buttons still render so the
      // layout does not shift, but the "selected" marking is hidden — showing
      // it would paint the wrong button first and then jump to the right one.
      className={`group inline-flex items-center rounded-full border border-border p-0.5 ${className}`}>
      {modes.map((value) => {
        const current = mode === value
        const active = mounted && current
        return (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={active}
            title={t(value)}
            // Collapsed to the current mode; the rest open sideways on hover or
            // keyboard focus (`focus-within` also covers a tap on touch screens).
            className={`flex h-7 shrink-0 items-center justify-center overflow-hidden rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              current
                ? 'w-7'
                : 'w-0 opacity-0 group-focus-within:ml-0.5 group-focus-within:w-7 group-focus-within:opacity-100 group-hover:ml-0.5 group-hover:w-7 group-hover:opacity-100'
            } ${
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
