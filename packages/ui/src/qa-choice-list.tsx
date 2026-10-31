'use client'

import {QaOptionCard, type QaOptionState} from './qa-option-card'

/** An answer at most this long counts as short — see `isCompactChoices`. */
const SHORT_OPTION_CHARS = 40

/**
 * Short answers sit in a 2-wide grid; one long answer sends the whole set back to
 * full-width rows so the text never gets squeezed into half a card. An odd count
 * (3, 5…) would leave a lone card in the last row, so it stays a list too.
 */
export function isCompactChoices(options: readonly {text: string}[]): boolean {
  return (
    options.length % 2 === 0 &&
    options.every((option) => option.text.length <= SHORT_OPTION_CHARS)
  )
}

/**
 * The answer cards of a choice question, exactly as the learner sees them. The learner's
 * `AnswerInput` and the admin's preview both draw this, so the grid, spacing and scrolling
 * are defined once; what a tap *does* is the caller's business.
 */
export function QaChoiceList({
  options,
  multi,
  label,
  stateOf,
  onPick,
  disabled = false,
  compact = isCompactChoices(options),
}: {
  options: readonly {id: string; text: string}[]
  /** Several answers can be picked (square boxes) rather than one (round). */
  multi: boolean
  /** Accessible name of the group. */
  label?: string
  stateOf: (optionId: string) => QaOptionState
  onPick: (optionId: string) => void
  disabled?: boolean
  compact?: boolean
}) {
  return (
    /* The answers get the height the question leaves over and split it evenly (no card taller
       than 40vh, unless its text needs more), so they fill the screen instead of huddling at
       the top. When they would not fit (a phone, four long options) the cards keep a readable
       height and only THIS box scrolls — the question stays in view. The padding keeps focus
       rings and shadows from being clipped by the scroll box. */
    <div className="-m-1 min-h-0 flex-1 overflow-y-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div
        role={multi ? 'group' : 'radiogroup'}
        aria-label={label}
        className={`grid min-h-full auto-rows-fr gap-2 [&>*]:max-h-[40vh] [&>*]:self-center ${compact ? 'grid-cols-2' : ''}`}>
        {options.map((option) => (
          <QaOptionCard
            key={option.id}
            text={option.text}
            role={multi ? 'checkbox' : 'radio'}
            shape={multi ? 'square' : 'round'}
            state={stateOf(option.id)}
            disabled={disabled}
            centered={compact}
            onClick={() => onPick(option.id)}
          />
        ))}
      </div>
    </div>
  )
}

/** The question box above the answers: capped under half the screen, the picture shrinking to fit. */
export function LearnQuestionBox({children}: {children: React.ReactNode}) {
  return (
    <div className="flex max-h-[45vh] min-h-0 shrink-0 flex-col text-body-1 font-semibold [&>div]:flex [&>div]:min-h-0 [&>div]:flex-col">
      {children}
    </div>
  )
}
