'use client'

import {useEffect} from 'react'
import hotToast, {Toaster, type ToastOptions} from 'react-hot-toast'

import type {AlertTone} from './alert'
import {Button} from './button'
import {Icon, ICONS} from './icons'
import {Typography} from './typography'

/**
 * Transient notifications: they float above the page, stack, and disappear on
 * their own.
 *
 * The in-flow sibling is `alert.tsx` — that one takes space in the layout and
 * stays until its owner stops rendering it. Rule of thumb: a form-level error
 * the user must fix is an `Alert` (it must not vanish while they read the
 * field); the confirmation of an action they just took is a `Toast`.
 *
 * Built on `react-hot-toast` rather than by hand: what makes a toast system
 * hard is the queue — stacking, reordering as one expires, pausing the timer on
 * hover, keeping the live region from re-announcing everything on every change.
 * Only the rendering is ours, so the tones still come from the theme tokens.
 */

/** Same four tones as `Alert`, deliberately — one vocabulary for both. */
export type ToastTone = AlertTone

/**
 * The tinted disc behind each icon. Spelled out in full (no string building) so
 * Tailwind sees every class. `info` uses `text-accent` for the same reason as in
 * `Alert`: `--primary` is too light for text on its own tint.
 */
const TONES = {
  error: {
    icon: ICONS.error,
    className: 'bg-danger/10 text-danger',
    role: 'alert',
    live: 'assertive',
  },
  success: {
    icon: ICONS.success,
    className: 'bg-success/10 text-success',
    role: 'status',
    live: 'polite',
  },
  info: {
    icon: ICONS.info,
    className: 'bg-primary/10 text-accent',
    role: 'status',
    live: 'polite',
  },
  warning: {
    icon: ICONS.warning,
    className: 'bg-warning/10 text-warning',
    role: 'status',
    live: 'polite',
  },
} as const satisfies Record<
  ToastTone,
  {icon: string; className: string; role: string; live: 'polite' | 'assertive'}
>

/**
 * Set by `<ToastHost />`. The close button is built inside the message, which is
 * created at call time, so the label has to be reachable from module scope.
 */
let closeLabelText = ''

/**
 * Uses the library's own API: `hotToast.success` / `hotToast.error` for the two
 * types it has, and a plain `hotToast` with a custom `icon` for the two it does
 * not (info, warning). The tone's disc goes in as the toast's `icon`, and
 * `ariaProps` is how an error gets to interrupt the screen reader while the rest
 * wait for a pause. The message is a render function so it can carry the close
 * button, since the library's default bar has none.
 */
function notify(tone: ToastTone, message: string, options?: ToastOptions) {
  const {icon, className, role, live} = TONES[tone]
  const render = (instance: {id: string}) => (
    <div className="flex w-full items-center gap-3">
      <Typography
        as="span"
        variant="body-3"
        className="min-w-0 flex-1 py-1 text-left">
        {message}
      </Typography>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => hotToast.dismiss(instance.id)}
        aria-label={closeLabelText}
        className="shrink-0">
        <Icon icon={ICONS.close} className="size-4" />
      </Button>
    </div>
  )
  const merged: ToastOptions = {
    icon: (
      <span
        aria-hidden="true"
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${className}`}>
        <Icon icon={icon} className="size-4" />
      </span>
    ),
    ariaProps: {role, 'aria-live': live},
    ...options,
  }
  if (tone === 'error') return hotToast.error(render, merged)
  if (tone === 'success') return hotToast.success(render, merged)
  return hotToast(render, merged)
}

/**
 * Fire a toast from anywhere — event handlers, mutation callbacks, outside
 * React entirely. `<ToastHost />` has to be mounted for it to show up.
 *
 * Messages are TRANSLATED STRINGS: call `t()` at the call site. This module has
 * no namespace of its own on purpose — it is shared by both apps.
 */
export const toast = {
  error: (message: string, options?: ToastOptions) =>
    notify('error', message, options),
  success: (message: string, options?: ToastOptions) =>
    notify('success', message, options),
  info: (message: string, options?: ToastOptions) =>
    notify('info', message, options),
  warning: (message: string, options?: ToastOptions) =>
    notify('warning', message, options),
  dismiss: hotToast.dismiss,
  remove: hotToast.remove,
}

/** Default lifetime. Errors get longer: they are the ones worth reading twice. */
const DURATION = {default: 4000, error: 6000} as const

/**
 * Mount once, next to the other providers in the root layout. Renders nothing
 * until a toast is fired.
 *
 * `closeLabel` comes in as a prop instead of being read from `common` here: a
 * package-level `useTranslations` would pin this component to one app's
 * namespace layout (see AGENTS.md).
 */
export function ToastHost({closeLabel}: {closeLabel: string}) {
  useEffect(() => {
    closeLabelText = closeLabel
  }, [closeLabel])

  return (
    <Toaster
      position="top-center"
      gutter={8}
      containerClassName="!z-[100]"
      toastOptions={{
        duration: DURATION.default,
        error: {duration: DURATION.error},
        className: 'text-body-3',
        // The library paints these inline, so the theme tokens go in as inline
        // CSS variables too — a class would lose to them.
        style: {
          width: 'min(28rem, calc(100vw - 2rem))',
          maxWidth: 'none',
          padding: '0.75rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--surface-foreground)',
          boxShadow: 'var(--shadow-lg)',
          pointerEvents: 'auto',
        },
      }}
    />
  )
}
