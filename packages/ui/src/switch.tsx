'use client'

import {forwardRef, useId} from 'react'
import {Switch as RadixSwitch} from 'radix-ui'

import {Spinner} from './spinner'
import {Typography} from './typography'

type SwitchProps = Omit<
  React.ComponentPropsWithoutRef<typeof RadixSwitch.Root>,
  'children'
> & {
  /** If omitted, pass an `aria-label` yourself — an unlabelled switch is an a11y bug. */
  label?: string
  /**
   * A change whose request is still in flight. Implies `disabled`: the switch
   * keeps showing the state the server last confirmed, so a second click cannot
   * race the first.
   */
  loading?: boolean
}

/**
 * An on/off switch for a state that takes effect immediately (publish a set,
 * enable a key) — as opposed to a checkbox, whose value is only sent with a form.
 *
 * Built on Radix's Switch, so `role="switch"`, `aria-checked` and the Space/Enter
 * keys come with it. The track follows `data-state`, which means it works the
 * same controlled and uncontrolled.
 */
export const Switch = forwardRef<
  React.ComponentRef<typeof RadixSwitch.Root>,
  SwitchProps
>(function Switch(
  {label, loading = false, disabled, id, className = '', ...props},
  ref,
) {
  const generatedId = useId()
  const switchId = id ?? generatedId
  const isDisabled = disabled || loading

  return (
    <div className="inline-flex items-center gap-2.5">
      <RadixSwitch.Root
        {...props}
        id={switchId}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={`group relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent outline-none transition-colors
          bg-border data-[state=checked]:bg-primary
          focus-visible:ring-2 focus-visible:ring-ring/40
          disabled:cursor-not-allowed ${loading ? 'cursor-progress' : isDisabled ? 'opacity-50' : 'cursor-pointer'}
          ${className}`}>
        <RadixSwitch.Thumb className="pointer-events-none flex size-5 translate-x-0.5 items-center justify-center rounded-full bg-surface shadow-sm transition-transform data-[state=checked]:translate-x-[1.375rem]">
          {loading ? <Spinner size="xs" /> : null}
        </RadixSwitch.Thumb>
      </RadixSwitch.Root>
      {label ? (
        <Typography
          variant="body-3"
          as="label"
          htmlFor={switchId}
          className={`select-none ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${
            disabled ? 'opacity-50' : ''
          }`}>
          {label}
        </Typography>
      ) : null}
    </div>
  )
})
