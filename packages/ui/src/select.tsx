import {forwardRef, useId} from 'react'
import {Icon, ICONS} from './icons'
import {Typography} from './typography'
import {keysOf} from './variants'

/**
 * Height, text size and the padding that keeps the text clear of the chevron.
 * `chevron` is the chevron's inset from the right edge — it sits in the same
 * place the text padding leaves room for, so the two have to change together.
 * Mirrors `Button`'s box sizes so a control row lines up.
 */
const SIZES = {
  lg: {field: 'h-12 pl-4 pr-11 text-body-2', chevron: 'right-4 size-5'},
  md: {field: 'h-10 pl-3 pr-9 text-body-3', chevron: 'right-3 size-4'},
  sm: {field: 'h-8 pl-3 pr-8 text-body-3', chevron: 'right-2.5 size-4'},
  xs: {field: 'h-7 pl-2.5 pr-7 text-body-4', chevron: 'right-2 size-3.5'},
} as const

export type SelectSize = keyof typeof SIZES

/** The list, derived from the table above — see `variants.ts`. */
export const SELECT_SIZES = keysOf(SIZES)

/**
 * `disabled` keeps a choice visible but unpickable. Removing it instead is what
 * makes someone hunt for the option that "disappeared" — the label says why it
 * cannot be chosen.
 */
type SelectOption = {value: string; label: string; disabled?: boolean}

// `size` is the native attribute for the visible row count of a listbox; this
// control is always a one-row dropdown, so the name is free for the box size.
type SelectProps = Omit<
  React.ComponentPropsWithoutRef<'select'>,
  'children' | 'size'
> & {
  label: string
  options: SelectOption[]
  size?: SelectSize
  error?: string
  /** A line under the field. Hidden while an error shows — see `Input`. */
  hint?: string
  /** Label for the empty choice (`value=""`). Omitted means no empty option. */
  placeholder?: string
  /** Keep the label for screen readers only — for a filter whose purpose is obvious. */
  hideLabel?: boolean
}

/**
 * The browser's native `<select>` with the platform arrow replaced by our own
 * chevron, shaped like `Input` so a form mixing the two stays aligned.
 *
 * Deliberately not a custom-drawn dropdown: admin's filters have to work by
 * keyboard and on mobile, which is exactly where hand-rolled comboboxes break.
 * Only the closed control is styled — the open list stays native.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      label,
      options,
      size = 'md',
      error,
      hint,
      placeholder,
      hideLabel,
      id,
      className = '',
      ...props
    },
    ref,
  ) {
    const generatedId = useId()
    const selectId = id ?? generatedId
    const errorId = `${selectId}-error`
    const hintId = `${selectId}-hint`

    return (
      <div className="flex flex-col gap-1.5">
        <Typography
          variant="title-4"
          as="label"
          htmlFor={selectId}
          className={hideLabel ? 'sr-only' : undefined}>
          {label}
        </Typography>
        <div className="relative">
          <select
            {...props}
            id={selectId}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={`peer ${SIZES[size].field} w-full appearance-none rounded-md border
            bg-surface text-surface-foreground border-border
            outline-none transition-colors
            hover:border-muted-foreground
            focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40
            disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground
            aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/30
            ${className}`}>
            {placeholder ? (
              <option value="" className="bg-surface text-muted-foreground">
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="bg-surface">
                {option.label}
              </option>
            ))}
          </select>
          <Icon
            icon={ICONS.chevronDown}
            className={`pointer-events-none absolute top-1/2 ${SIZES[size].chevron} -translate-y-1/2
            text-muted-foreground transition-colors peer-focus-visible:text-primary
            peer-disabled:opacity-50`}
          />
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
            variant="body-4"
            id={hintId}
            className="text-muted-foreground">
            {hint}
          </Typography>
        ) : null}
      </div>
    )
  },
)
