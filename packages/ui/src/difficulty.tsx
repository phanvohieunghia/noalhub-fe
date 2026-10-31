'use client'

import {Typography} from './typography'

export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_LEVELS: readonly DifficultyLevel[] = [
  'easy',
  'medium',
  'hard',
]

/**
 * One row per level: how many of the three bars are lit, and the theme tokens it
 * wears. Written out in full — Tailwind only sees class names that appear literally.
 */
const LEVELS = {
  easy: {
    lit: 1,
    bar: 'bg-success',
    text: 'text-success',
    selected: 'bg-success text-background',
  },
  medium: {
    lit: 2,
    bar: 'bg-warning',
    text: 'text-warning',
    selected: 'bg-warning text-background',
  },
  hard: {
    lit: 3,
    bar: 'bg-danger',
    text: 'text-danger',
    selected: 'bg-danger text-background',
  },
} as const satisfies Record<DifficultyLevel, unknown>

/** Rising bars, like a signal meter: the lit ones are the difficulty. */
export function DifficultyBars({
  level,
  onSolid = false,
  className = '',
}: {
  level: DifficultyLevel
  /** Drawn on a filled background in the level's own colour: the bars turn to the page colour. */
  onSolid?: boolean
  className?: string
}) {
  const {lit, bar} = LEVELS[level]
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-end gap-0.5 ${className}`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`w-1 rounded-full ${n === 1 ? 'h-1.5' : n === 2 ? 'h-2.5' : 'h-3.5'} ${
            n <= lit
              ? onSolid
                ? 'bg-background'
                : bar
              : onSolid
                ? 'bg-background/40'
                : 'bg-muted-foreground/30'
          }`}
        />
      ))}
    </span>
  )
}

/** A small read-only chip: the bars and the (already translated) name. */
export function DifficultyBadge({
  level,
  label,
  className = '',
}: {
  level: DifficultyLevel
  label: string
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-muted px-2.5 py-[3px] text-body-4 font-medium ring-1 ring-inset ring-border ${LEVELS[level].text} ${className}`}>
      <DifficultyBars level={level} className="scale-90" />
      {label}
    </span>
  )
}

/**
 * Pick one of the three difficulties in a segmented pill — the same shape as the theme
 * and language switches. The chosen segment is filled in the level's colour. Tapping it
 * again clears it (`value` goes back to `''`) unless `clearable` is off — "not set" is a
 * state, not a fourth segment.
 *
 * Labels come in as props: this package pins no i18n namespace.
 */
export function DifficultyPicker({
  value,
  onChange,
  labels,
  label,
  clearable = true,
  size = 'md',
  hideLabel = false,
  className = '',
}: {
  value: DifficultyLevel | ''
  onChange: (value: DifficultyLevel | '') => void
  /** The translated name of each level. */
  labels: Record<DifficultyLevel, string>
  /** Name of the group, for the visible caption and screen readers. */
  label: string
  clearable?: boolean
  size?: 'md' | 'sm'
  hideLabel?: boolean
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {hideLabel ? null : (
        <Typography variant="body-3" className="font-medium">
          {label}
        </Typography>
      )}
      <div
        role="radiogroup"
        aria-label={label}
        className="inline-flex w-fit max-w-full items-center gap-0.5 rounded-full border border-border p-0.5">
        {DIFFICULTY_LEVELS.map((level) => {
          const picked = value === level
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={picked}
              onClick={() =>
                onChange(picked ? (clearable ? '' : level) : level)
              }
              className={`flex items-center justify-center gap-2 rounded-full whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                size === 'sm'
                  ? 'px-3 py-1 text-body-4'
                  : 'px-4 py-1.5 text-body-3'
              } ${
                picked
                  ? `${LEVELS[level].selected} font-medium`
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              <DifficultyBars level={level} onSolid={picked} />
              {labels[level]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
