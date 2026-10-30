import {forwardRef, useId} from 'react'
import {Icon, ICONS} from './icons'
import {Typography} from './typography'
import {keysOf} from './variants'

/**
 * Height, text size and the padding that keeps the text clear of the icons.
 * `pr` is indexed by how many icons sit on the right edge (0, 1 or 2): the
 * status icon (error / lock) and the `trailing` slot. Mirrors `Select` and
 * `Button` so a control row lines up.
 */
const SIZES = {
  lg: {
    field: 'h-12 text-body-2',
    pl: ['pl-4', 'pl-11'],
    pr: ['pr-4', 'pr-12', 'pr-[4.5rem]'],
    icon: 'size-5',
    inset: 'left-4',
    trailing: 'right-4',
  },
  md: {
    field: 'h-10 text-body-3',
    pl: ['pl-3', 'pl-9'],
    pr: ['pr-3', 'pr-9', 'pr-14'],
    icon: 'size-4',
    inset: 'left-3',
    trailing: 'right-3',
  },
  sm: {
    field: 'h-8 text-body-3',
    pl: ['pl-3', 'pl-9'],
    pr: ['pr-3', 'pr-9', 'pr-14'],
    icon: 'size-4',
    inset: 'left-3',
    trailing: 'right-3',
  },
  xs: {
    field: 'h-7 text-body-4',
    pl: ['pl-2.5', 'pl-8'],
    pr: ['pr-2.5', 'pr-8', 'pr-12'],
    icon: 'size-3.5',
    inset: 'left-2.5',
    trailing: 'right-2.5',
  },
} as const

export type InputSize = keyof typeof SIZES

/** The list, derived from the table above — see `variants.ts`. */
export const INPUT_SIZES = keysOf(SIZES)

// `size` is the native attribute for the character width of a text field; this
// control is always full width, so the name is free for the box size.
export type InputProps = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'size'
> & {
  label: string
  size?: InputSize
  error?: string
  /**
   * A line under the field explaining what to put in it. Hidden while an error
   * is showing: two sentences under one input compete, and the error is the one
   * that has to be read.
   */
  hint?: string
  /** Keep the label for screen readers only — for a field whose purpose is obvious (search). */
  hideLabel?: boolean
  /** An iconify name drawn inside the left edge of the field. */
  leadingIcon?: string
  /**
   * Something drawn inside the right edge, after the status icon — an icon, or
   * a button such as a show/hide-password toggle. It is placed over the field,
   * so give it a pointer-events-enabled element if it has to be clickable.
   */
  trailing?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    size = 'md',
    error,
    hint,
    hideLabel,
    leadingIcon,
    trailing,
    id,
    className = '',
    ...props
  },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const box = SIZES[size]

  // A locked field says so with an icon rather than by looking merely greyed.
  const locked = props.readOnly || props.disabled
  const rightIcons = (error ? 1 : 0) + (locked ? 1 : 0) + (trailing ? 1 : 0)
  const hasStatus = Boolean(error) || Boolean(locked)

  return (
    <div className="flex flex-col gap-1.5">
      <Typography
        variant="title-4"
        as="label"
        htmlFor={inputId}
        className={hideLabel ? 'sr-only' : undefined}>
        {label}
      </Typography>
      <div className="relative">
        {leadingIcon ? (
          <Icon
            icon={leadingIcon}
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground ${box.inset} ${box.icon}`}
          />
        ) : null}
        <input
          {...props}
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`${box.field} w-full rounded-md border ${box.pl[leadingIcon ? 1 : 0]} ${box.pr[Math.min(rightIcons, 2)]} outline-none transition-colors
            bg-surface text-surface-foreground border-border
            placeholder:text-muted-foreground
            hover:border-muted-foreground
            focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40
            read-only:bg-muted read-only:hover:border-border
            disabled:cursor-not-allowed disabled:opacity-50
            aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/30
            ${className}`}
        />
        {hasStatus || trailing ? (
          <div
            className={`absolute top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-muted-foreground ${box.trailing}`}>
            {error ? (
              <Icon icon={ICONS.error} className={`text-danger ${box.icon}`} />
            ) : null}
            {locked ? <Icon icon={ICONS.lock} className={box.icon} /> : null}
            {trailing}
          </div>
        ) : null}
      </div>
      {error ? (
        <Typography
          variant="body-3"
          id={errorId}
          role="alert"
          className="text-danger">
          {error}
        </Typography>
      ) : hint ? (
        <Typography
          variant="body-3"
          id={hintId}
          className="text-muted-foreground">
          {hint}
        </Typography>
      ) : null}
    </div>
  )
})
