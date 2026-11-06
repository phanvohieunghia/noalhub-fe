'use client'

import {useEffect} from 'react'
import {useTranslations} from 'next-intl'

import {Button} from './button'
import {Icon, ICONS} from './icons'
import {Typography} from './typography'
import {keysOf} from './variants'

/**
 * Inline alerts (form-level banners): one tone table, four thin wrappers.
 * Colours come from the status tokens (`docs/theme.md`), so they follow
 * light/dark on their own.
 *
 * This is the IN-FLOW one: it takes space in the layout, sits next to the field
 * or form it belongs to, and stays until its owner stops rendering it. For a
 * transient message that floats over the page and stacks with others, see
 * `toast.tsx`.
 */
const TONES = {
  error: {
    icon: ICONS.error,
    className: 'border-danger/40 bg-danger/10',
    iconClass: 'text-danger',
    role: 'alert',
  },
  success: {
    icon: ICONS.success,
    className: 'border-success/40 bg-success/10',
    iconClass: 'text-success',
    role: 'status',
  },
  info: {
    icon: ICONS.info,
    /* `info` is its own blue token, not the brand teal: a banner in the brand
       color reads as theme, not as a status. The ratio is checked against the
       banner's own /10 tint, like the other three tones. */
    className: 'border-info/40 bg-info/10',
    iconClass: 'text-info',
    role: 'status',
  },
  warning: {
    icon: ICONS.warning,
    className: 'border-warning/50 bg-warning/15',
    iconClass: 'text-warning',
    role: 'status',
  },
} as const

export type AlertTone = keyof typeof TONES

/** The list, derived from the table above — see `variants.ts`. */
export const ALERT_TONES = keysOf(TONES)

export type AlertProps = {
  tone: AlertTone
  message?: string | null
  /**
   * Makes the alert dismissible: shows a close button, and is what the
   * auto-dismiss timer calls. Without it the alert stays until the owner stops
   * rendering it — which is what a form-level error should do.
   */
  onDismiss?: () => void
  /**
   * Dismiss on its own after this many ms. Only has an effect together with
   * `onDismiss` — closing is the owner's state change, never ours.
   */
  autoDismissMs?: number
}

export function Alert({tone, message, onDismiss, autoDismissMs}: AlertProps) {
  // The timer restarts whenever the text changes, so a second message replacing
  // the first is shown for its full duration instead of inheriting what is left
  // of the previous one.
  useEffect(() => {
    if (!message || !onDismiss || !autoDismissMs) return
    const timer = setTimeout(onDismiss, autoDismissMs)
    return () => clearTimeout(timer)
  }, [message, onDismiss, autoDismissMs])

  const t = useTranslations('common')
  if (!message) return null
  const {icon, iconClass, className, role} = TONES[tone]

  return (
    <Typography
      variant="body-3"
      role={role}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-foreground ${className}`}>
      <Icon icon={icon} className={`mt-0.5 size-4 shrink-0 ${iconClass}`} />
      <Typography as="span" variant="body-3" className="flex-1">
        {message}
      </Typography>
      {onDismiss ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDismiss}
          aria-label={t('actions.close')}
          className="-mr-1 shrink-0">
          <Icon icon={ICONS.close} className="size-4" />
        </Button>
      ) : null}
    </Typography>
  )
}

type ToneAlertProps = Omit<AlertProps, 'tone'>

/** Banner for form-level errors (5xx, offline, anything not tied to a field). */
export function AlertError(props: ToneAlertProps) {
  return <Alert tone="error" {...props} />
}

export function AlertSuccess(props: ToneAlertProps) {
  return <Alert tone="success" {...props} />
}

export function AlertInfo(props: ToneAlertProps) {
  return <Alert tone="info" {...props} />
}

export function AlertWarning(props: ToneAlertProps) {
  return <Alert tone="warning" {...props} />
}
