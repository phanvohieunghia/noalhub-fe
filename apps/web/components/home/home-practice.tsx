'use client'

import {routes} from '@noalhub/core/routes'
import {Link} from '@noalhub/i18n/navigation'
import {useEffect, useState, type CSSProperties} from 'react'

import {DifficultyBadge, type DifficultyLevel} from '@noalhub/ui/difficulty'
import {Icon} from '@noalhub/ui/icons'
import {Typography} from '@noalhub/ui/typography'

export type HomePracticeItem = {
  topic: string
  difficulty: DifficultyLevel
  question: string
  options: string[]
  /** Index into `options`. */
  answer: number
}

export type HomePracticeCopy = {
  eyebrow: string
  heading: string
  lead: string
  steps: {title: string; body: string}[]
  cta: string
  demoLabel: string
  /** A template with `{current}` and `{total}` slots. */
  progress: string
  difficulty: Record<DifficultyLevel, string>
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

/** How long a card stays on top, how long the right answer waits to light up. */
const CARD_MS = 3200
const REVEAL_MS = 1400
/** How long the top card takes to fly off. */
const FLY_MS = 650

/**
 * Where a card sits in the stack, by how far it is from the top (`depth`). The top card
 * is flat and opaque; each one behind it is smaller, lower, tilted the other way and
 * fainter, so the stack reads as a deck. A card that is flying off overrides all this.
 */
function stackStyle(depth: number, exiting: boolean): CSSProperties {
  if (exiting) {
    return {
      transform: 'translate3d(-125%, -6%, 0) rotate(-14deg)',
      opacity: 0,
      zIndex: 40,
    }
  }
  if (depth === 0) {
    return {transform: 'translate3d(0,0,0)', opacity: 1, zIndex: 30}
  }
  if (depth === 1) {
    return {
      transform: 'translate3d(0,26px,0) scale(0.94) rotate(-2.5deg)',
      opacity: 0.6,
      zIndex: 20,
    }
  }
  return {
    transform: 'translate3d(0,52px,0) scale(0.88) rotate(2deg)',
    opacity: 0.32,
    zIndex: 10,
  }
}

/**
 * The home's practice teaser, built as a landing block rather than a form: a dark
 * brand stage with soft light behind it, a big pitch on the left, and on the right a
 * deck of question cards.
 *
 * The deck is a showcase, not a quiz: nothing on it is clickable. Every few seconds the
 * top card is thrown off to the left while the cards behind it move up one place and the
 * thrown card slips to the back of the stack. Part-way through each card the right
 * answer lights up. Hovering the deck lifts the answer under the pointer and pauses the
 * rotation, so there is time to read.
 *
 * All cards are always mounted in one grid cell, so the deck is as tall as its tallest
 * card and never jumps; only transform and opacity animate. Nothing here talks to the
 * backend; the questions are copy from `web.home.practice`.
 */
export function HomePractice({
  items,
  copy,
}: {
  items: HomePracticeItem[]
  copy: HomePracticeCopy
}) {
  const [index, setIndex] = useState(0)
  /** The card that is flying off; it lands at the back of the stack once it is gone. */
  const [exiting, setExiting] = useState<number | null>(null)
  /** The card that just landed at the back: it jumps there without sweeping across. */
  const [snapped, setSnapped] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [paused, setPaused] = useState(false)
  const count = items.length

  useEffect(() => {
    if (paused || count < 2) return
    const reveal = window.setTimeout(() => setRevealed(true), REVEAL_MS)
    const next = window.setTimeout(() => {
      setExiting(index)
      setIndex((index + 1) % count)
      setRevealed(false)
    }, CARD_MS)
    return () => {
      window.clearTimeout(reveal)
      window.clearTimeout(next)
    }
  }, [index, paused, count])

  // Independent of the pause, or a hover mid-flight would leave a card hanging off-screen.
  useEffect(() => {
    if (exiting === null) return
    const landed = exiting
    const t = window.setTimeout(() => {
      setExiting(null)
      setSnapped(landed)
    }, FLY_MS)
    return () => window.clearTimeout(t)
  }, [exiting])

  useEffect(() => {
    if (snapped === null) return
    const t = window.setTimeout(() => setSnapped(null), 80)
    return () => window.clearTimeout(t)
  }, [snapped])

  const item = items[index]
  if (!item) return null

  return (
    <section
      aria-labelledby="home-practice-heading"
      className="relative isolate overflow-hidden rounded-xl border border-brand-50/15 bg-brand-900 px-5 py-12 text-brand-50 md:px-12 md:py-20 lg:px-16 lg:py-24">
      {/* A quiet vignette behind the stage, like lamplight on paper. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_15%,color-mix(in_srgb,var(--color-brand-400)_16%,transparent),transparent)]"
      />

      <div className="grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-20">
        <div className="flex flex-col gap-7">
          <span className="flex w-fit items-center gap-3 font-serif text-body-3 tracking-[0.22em] text-brand-200 uppercase">
            <span aria-hidden className="h-px w-8 bg-brand-200/60" />
            {copy.eyebrow}
          </span>

          <Typography
            variant="h1"
            as="h2"
            id="home-practice-heading"
            className="font-serif text-4xl leading-[1.1] font-normal tracking-tight text-balance md:text-6xl xl:text-7xl">
            {copy.heading}
          </Typography>

          <Typography
            variant="body-1"
            className="max-w-xl font-serif text-lg text-brand-100/85 text-pretty md:text-xl md:leading-relaxed">
            {copy.lead}
          </Typography>

          <ol className="flex flex-col">
            {copy.steps.map((step, i) => (
              <li
                key={step.title}
                className="flex items-start gap-5 border-t border-brand-50/20 py-5 last:border-b">
                <span
                  aria-hidden
                  className="w-10 shrink-0 font-serif text-2xl text-brand-200 italic tabular-nums">
                  0{i + 1}
                </span>
                <div className="flex flex-col gap-0.5">
                  <Typography
                    variant="title-1"
                    as="h3"
                    className="font-serif font-medium text-brand-50">
                    {step.title}
                  </Typography>
                  <Typography variant="body-2" className="text-brand-100/75">
                    {step.body}
                  </Typography>
                </div>
              </li>
            ))}
          </ol>

          <Link
            href={routes.practice}
            className="group inline-flex w-fit items-center gap-3 rounded-md bg-brand-50 px-6 py-3.5 font-serif text-title-2 font-medium text-brand-950 transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900 focus-visible:outline-none">
            {copy.cta}
            <Icon
              icon="lucide:arrow-right"
              className="size-5 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* The stage: the progress bar stays put; the cards are all mounted, stacked in one grid cell. */}
        <div
          role="img"
          aria-label={copy.demoLabel}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="mx-auto flex w-full max-w-xl flex-col gap-6 lg:max-w-none">
          <div aria-hidden className="flex items-center gap-2">
            {items.map((entry, k) => (
              <div key={entry.topic} className="flex flex-1 flex-col gap-2">
                <span className="h-0.5 w-full overflow-hidden bg-brand-50/20">
                  <span
                    key={k === index ? `on-${index}` : 'off'}
                    style={
                      k === index
                        ? {
                            animationDuration: `${CARD_MS}ms`,
                            animationPlayState: paused ? 'paused' : 'running',
                          }
                        : undefined
                    }
                    className={`block h-full origin-left bg-brand-200 ${
                      k === index
                        ? 'deck-fill'
                        : k < index
                          ? 'w-full opacity-60'
                          : 'w-0'
                    }`}
                  />
                </span>
                <span
                  className={`font-serif text-body-2 italic transition-colors duration-300 ${
                    k === index ? 'text-brand-50' : 'text-brand-100/60'
                  }`}>
                  {entry.topic}
                </span>
              </div>
            ))}
          </div>

          <div className="grid pb-14 [&>*]:col-start-1 [&>*]:row-start-1">
            {items.map((card, i) => {
              const depth = (i - index + count) % count
              const front = depth === 0 && exiting !== i
              return (
                <div
                  key={card.topic}
                  aria-hidden={!front}
                  style={{
                    ...stackStyle(depth, exiting === i),
                    transformOrigin: '50% 100%',
                    transitionDuration:
                      exiting === i
                        ? `${FLY_MS}ms`
                        : snapped === i
                          ? '0ms'
                          : '800ms',
                    transitionTimingFunction:
                      exiting === i
                        ? 'cubic-bezier(0.55, 0, 0.9, 0.4)'
                        : 'cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                  className={`light flex flex-col gap-6 rounded-lg border border-border bg-surface p-5 text-surface-foreground shadow-xl shadow-brand-950/40 transition-[transform,opacity] will-change-transform motion-reduce:transition-none md:p-8 ${
                    front ? '' : 'pointer-events-none'
                  }`}>
                  {/* The content fades with the card's place, so the stack shows shapes, not text. */}
                  <div
                    className={`flex flex-col gap-6 transition-opacity duration-500 ${
                      depth === 0 ? 'opacity-100' : 'opacity-0'
                    }`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Typography
                        as="span"
                        variant="body-3"
                        className="text-muted-foreground tabular-nums">
                        {copy.progress
                          .replace('{current}', String(i + 1))
                          .replace('{total}', String(count))}
                      </Typography>
                      <DifficultyBadge
                        level={card.difficulty}
                        label={copy.difficulty[card.difficulty]}
                      />
                    </div>

                    <Typography
                      variant="h3"
                      as="h3"
                      className="font-serif text-2xl leading-snug font-medium text-balance md:text-3xl">
                      {card.question}
                    </Typography>

                    <ul className="flex flex-col gap-2.5">
                      {card.options.map((text, o) => {
                        const right = front && revealed && o === card.answer
                        const dim = front && revealed && !right
                        return (
                          <li
                            key={text}
                            className={`group flex min-h-16 w-full items-center gap-4 rounded-md border px-4 py-2.5 transition-all duration-300 ${
                              right
                                ? 'border-success bg-success/12'
                                : dim
                                  ? 'border-border opacity-50'
                                  : 'border-border bg-surface hover:border-primary/60 hover:bg-tint'
                            }`}>
                            <span
                              aria-hidden
                              className={`flex size-8 shrink-0 items-center justify-center rounded-full font-serif text-body-1 italic transition-colors ${
                                right
                                  ? 'bg-success text-background'
                                  : 'border border-border text-accent group-hover:border-primary group-hover:text-primary'
                              }`}>
                              {right ? (
                                <Icon icon="lucide:check" className="size-5" />
                              ) : (
                                LETTERS[o]
                              )}
                            </span>
                            <Typography
                              as="span"
                              variant="body-1"
                              className="flex-1">
                              {text}
                            </Typography>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
