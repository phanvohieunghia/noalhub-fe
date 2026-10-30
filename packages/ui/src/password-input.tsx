'use client'

import {forwardRef, useState} from 'react'
import {Icon, ICONS} from './icons'
import {Input, type InputProps} from './input'

type PasswordInputProps = Omit<InputProps, 'type' | 'trailing'> & {
  /** Accessible names for the toggle — passed in so this component pins no i18n namespace. */
  showPasswordLabel: string
  hidePasswordLabel: string
}

/** `Input` with an eye button that reveals / hides the password. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {showPasswordLabel, hidePasswordLabel, ...props},
    ref,
  ) {
    const [visible, setVisible] = useState(false)

    return (
      <Input
        {...props}
        ref={ref}
        type={visible ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? hidePasswordLabel : showPasswordLabel}
            aria-pressed={visible}
            className="rounded p-0.5 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40">
            <Icon
              icon={visible ? ICONS.eyeOff : ICONS.eye}
              className="size-5"
            />
          </button>
        }
      />
    )
  },
)
