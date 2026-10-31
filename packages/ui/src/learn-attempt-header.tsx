'use client'

import {useEffect, useState} from 'react'

import {Button} from './button'
import {Icon, LUCIDE} from './icons'
import {Tooltip} from './tooltip'
import {Typography} from './typography'
import {useTabletUp} from './use-tablet-up'

/** How long the drawer stays down before it folds away again. */
const DRAWER_VISIBLE_MS = 3000
/** Questions per progress section, once the set is long enough to need sections. */
const SECTION_SIZE = 10
/** Up to this many questions the progress is one bar of per-question cells. */
const SINGLE_BAR_MAX = 10
/** Past this many questions a cell each no longer fits the bar: a section becomes one fill instead. */
const CELLS_MAX = 60
/** The most sections the bar is cut into, and the round section sizes it picks from to stay under it. */
const SECTIONS_MAX = 12
const COARSE_SECTION_SIZES = [10, 20, 25, 50, 100, 200, 250, 500, 1000]

/** The sections the progress bar is cut into for a set of `total` questions. */
export function progressSections(total: number) {
  const coarse = total > CELLS_MAX
  const sectionSize = coarse
    ? (COARSE_SECTION_SIZES.find(
        (size) => Math.ceil(total / size) <= SECTIONS_MAX,
      ) ?? Math.ceil(total / SECTIONS_MAX))
    : total <= SINGLE_BAR_MAX
      ? Math.max(1, total)
      : SECTION_SIZE
  const sections = Array.from(
    {length: Math.max(1, Math.ceil(total / sectionSize))},
    (_, i) => ({
      start: i * sectionSize,
      size: Math.max(1, Math.min(sectionSize, total - i * sectionSize)),
    }),
  )
  return {coarse, sectionSize, sections}
}

export type LearnAttemptHeaderLabels = {
  back: string
  showHeader: string
  hideHeader: string
  progress: string
  /** The report button; leave out together with `onReport` to hide it. */
  report?: string
  /** "Question 18 of 536", with the section size when the bar is cut into big sections. */
  position: (info: {
    current: number
    total: number
    /** Set only when each bar section covers several questions. */
    sectionSize: number | null
  }) => string
}

/**
 * The learner's header while answering: a segmented progress bar, and under it the
 * title row (back, title, report) — a drawer that drops over the question on a phone and
 * simply sits above the bar from tablet width up.
 *
 * It is the one definition of that header: the web app's attempt screen and the admin's
 * question preview both render it, so a change here reaches both. Everything it says
 * comes in through `labels` (this package pins no i18n namespace).
 *
 * `contained` anchors the phone drawer to the nearest positioned ancestor instead of the
 * viewport — for a preview drawn inside a frame. `wide` overrides the viewport check for
 * "tablet or up", for the same reason: a preview's width is the frame's, not the window's.
 */
export function LearnAttemptHeader({
  title,
  answered,
  total,
  position,
  labels,
  onBack,
  onReport,
  contained = false,
  wide,
  className = '',
}: {
  title: string
  answered: number
  total: number
  /** The question the learner is on, 1-based. */
  position: number
  labels: LearnAttemptHeaderLabels
  onBack: () => void
  onReport?: () => void
  contained?: boolean
  wide?: boolean
  className?: string
}) {
  const viewportWide = useTabletUp()
  const tabletUp = wide ?? viewportWide
  const {coarse, sectionSize, sections} = progressSections(total)

  // The position label lives in a tooltip: hover/focus open it, and a tap pins
  // it for a moment (Radix itself closes on click and ignores touch).
  const [tipHover, setTipHover] = useState(false)
  const [tipPinned, setTipPinned] = useState(false)
  useEffect(() => {
    if (!tipPinned) return
    const timer = window.setTimeout(() => setTipPinned(false), 2000)
    return () => window.clearTimeout(timer)
  }, [tipPinned])

  // The drawer is tucked away on arrival, folds back after a few seconds, and the
  // handle brings it down for the same few seconds.
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => setOpen(false), DRAWER_VISIBLE_MS)
    return () => window.clearTimeout(timer)
  }, [open])

  const positionLabel = labels.position({
    current: position,
    total,
    sectionSize: coarse ? sectionSize : null,
  })

  return (
    <header
      // Not `relative` when contained: the phone drawer anchors to the frame around it.
      className={`flex shrink-0 flex-col ${contained ? '' : 'relative'} ${tabletUp ? 'mb-4' : ''} ${className}`}>
      <div className="flex items-center gap-1">
        <Tooltip
          label={positionLabel}
          open={tipHover || tipPinned}
          onOpenChange={setTipHover}>
          <div
            role="progressbar"
            tabIndex={0}
            aria-label={labels.progress}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={answered}
            aria-valuetext={labels.position({
              current: position,
              total,
              sectionSize: null,
            })}
            onClick={() => setTipPinned(true)}
            className="flex min-w-0 flex-1 cursor-pointer gap-1.5 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            {sections.map(({start, size}) => (
              <div
                key={start}
                // A section is as wide as the questions it holds, so a short
                // last one does not read as a full stretch of the set.
                style={{flexGrow: size, flexBasis: 0}}
                className="flex min-w-0 gap-0.5 rounded-md border border-border p-0.5">
                {coarse ? (
                  <div className="h-2 w-full overflow-hidden rounded-xs bg-foreground/15">
                    <div
                      className="h-full bg-primary transition-[width] duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, ((answered - start) / size) * 100))}%`,
                      }}
                    />
                  </div>
                ) : (
                  Array.from({length: size}, (_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-xs transition-colors duration-300 ${
                        start + i < answered ? 'bg-primary' : 'bg-foreground/15'
                      }`}
                    />
                  ))
                )}
              </div>
            ))}
          </div>
        </Tooltip>
        {tabletUp ? null : (
          <Button
            variant="ghost"
            size="icon"
            shape="circle"
            aria-label={open ? labels.hideHeader : labels.showHeader}
            aria-expanded={open}
            onClick={() => setOpen((now) => !now)}
            className="-mr-2 shrink-0">
            <Icon icon={open ? LUCIDE.chevronUp : LUCIDE.chevronDown} />
          </Button>
        )}
      </div>

      {/* On a phone the drawer comes down from the top over the question instead of pushing it:
          a strip clips it and the panel slides in from above. While open the strip also catches an
          outside tap to close it; `inert` keeps the tucked-away controls out of the tab order.
          From tablet width up it is an ordinary row above the progress bar. */}
      <div
        inert={!tabletUp && !open}
        onClick={() => setOpen(false)}
        className={
          tabletUp
            ? 'order-first'
            : `${contained ? 'absolute' : 'fixed'} inset-x-0 top-0 z-40 overflow-hidden pb-6 ${
                open ? 'pointer-events-auto' : 'pointer-events-none'
              }`
        }>
        <div
          onClick={(event) => event.stopPropagation()}
          className={
            tabletUp
              ? 'flex w-full items-center gap-2 pb-2'
              : `mx-auto flex w-full max-w-3xl items-center gap-2 border-x border-b border-border bg-surface px-3 pt-3 pb-2 shadow-lg transition-transform duration-300 ease-out motion-reduce:duration-200 ${
                  open ? 'translate-y-0' : '-translate-y-[calc(100%+1.5rem)]'
                }`
          }>
          <Button
            variant="ghost"
            size="icon"
            shape="circle"
            aria-label={labels.back}
            className="shrink-0"
            onClick={onBack}>
            <Icon icon={LUCIDE.arrowLeft} />
          </Button>
          {/* One line with an ellipsis; the full title is the tooltip. */}
          <Tooltip label={title} side="bottom">
            <Typography
              variant="h5"
              as="h1"
              className="min-w-0 flex-1 truncate">
              {title || ' '}
            </Typography>
          </Tooltip>
          {onReport ? (
            <Button
              variant="ghost"
              size="icon"
              shape="circle"
              aria-label={labels.report}
              title={labels.report}
              className="shrink-0"
              onClick={() => {
                setOpen(false)
                onReport()
              }}>
              <Icon icon={LUCIDE.flag} />
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
