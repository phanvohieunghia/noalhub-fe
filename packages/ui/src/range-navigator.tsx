'use client'

import {useId, useRef} from 'react'

/** The smallest window the handles can be squeezed to, in items. */
const MIN_SPAN = 5
/** The mini chart is bucketed to at most this many points, whatever the data size. */
const BUCKETS = 120
const HEIGHT = 64

type Drag = {
  mode: 'start' | 'end' | 'move'
  x: number
  start: number
  end: number
}

/**
 * A stock-chart style range navigator: the whole data set drawn small as an
 * area, the visible window lifted out of a dimmed surround, and a grip handle
 * on each edge. Drag a handle to resize the window, drag the window to pan it,
 * click outside it to jump there. The handles are sliders for the keyboard
 * (arrows move by 1, Shift+arrows by 10).
 *
 * `values` is one non-negative number per item (in order); `start` / `end` are
 * inclusive indices into it.
 */
export function RangeNavigator({
  values,
  start,
  end,
  onChange,
  startLabel,
  endLabel,
}: {
  values: readonly number[]
  start: number
  end: number
  onChange: (start: number, end: number) => void
  startLabel: string
  endLabel: string
}) {
  const gradient = useId()
  const track = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const total = values.length
  const minSpan = Math.min(MIN_SPAN, total)

  const buckets = Math.min(total, BUCKETS)
  const sums = Array.from({length: buckets}, (_, b) => {
    const from = Math.floor((b * total) / buckets)
    const to = Math.max(from + 1, Math.floor(((b + 1) * total) / buckets))
    let sum = 0
    for (let i = from; i < to; i++) sum += values[i]
    return sum
  })
  // A 3-point moving average so sparse data reads as a soft curve, not a comb of spikes.
  const smooth = sums.map((_, b) => {
    const a = sums[Math.max(b - 1, 0)]
    const c = sums[Math.min(b + 1, buckets - 1)]
    return (a + sums[b] * 2 + c) / 4
  })
  const top = Math.max(...smooth, 0)
  const points = smooth.map((value, b) => {
    const x = buckets === 1 ? 50 : (b / (buckets - 1)) * 100
    const y = 92 - (top > 0 ? (value / top) * 80 : 0)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })
  const line = `M${points.join(' L')}`
  const area = `${line} L100,100 L0,100 Z`

  const clamp = (value: number, low: number, high: number) =>
    Math.min(Math.max(value, low), high)
  const shift = (event: React.PointerEvent) => {
    const box = track.current?.getBoundingClientRect()
    const state = drag.current
    if (!box || !state || box.width === 0) return
    const delta = Math.round(((event.clientX - state.x) / box.width) * total)
    if (state.mode === 'start') {
      onChange(
        clamp(state.start + delta, 0, state.end - minSpan + 1),
        state.end,
      )
    } else if (state.mode === 'end') {
      onChange(
        state.start,
        clamp(state.end + delta, state.start + minSpan - 1, total - 1),
      )
    } else {
      const span = state.end - state.start
      const from = clamp(state.start + delta, 0, total - 1 - span)
      onChange(from, from + span)
    }
  }
  const begin = (mode: Drag['mode'], event: React.PointerEvent) => {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {mode, x: event.clientX, start, end}
  }
  const finish = () => {
    drag.current = null
  }
  const jump = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const span = end - start
    const centre = Math.round(((event.clientX - box.left) / box.width) * total)
    const from = clamp(centre - Math.round(span / 2), 0, total - 1 - span)
    onChange(from, from + span)
  }
  const nudge = (which: 'start' | 'end', event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 10 : 1
    const direction =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (direction === 0) return
    event.preventDefault()
    if (which === 'start') {
      onChange(clamp(start + direction * step, 0, end - minSpan + 1), end)
    } else {
      onChange(
        start,
        clamp(end + direction * step, start + minSpan - 1, total - 1),
      )
    }
  }

  // A handful of round tick labels along the bottom, like the dates of a stock navigator.
  const tickStep =
    [10, 25, 50, 100, 250, 500].find((step) => total / step <= 6) ?? 1000
  const ticks = Array.from(
    {length: Math.floor(total / tickStep)},
    (_, i) => (i + 1) * tickStep,
  ).filter((n) => n < total)

  const left = (start / total) * 100
  const right = ((end + 1) / total) * 100

  return (
    <div
      ref={track}
      onPointerDown={jump}
      style={{height: HEIGHT}}
      className="relative touch-none rounded-lg border border-border bg-background/50 select-none">
      {/* Clipped layer: the chart, dimming and window. The handles sit outside it so they can overhang the edge. */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
          className="absolute inset-0 size-full">
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
              <stop
                offset="100%"
                stopColor="var(--primary)"
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradient})`} />
          <path
            d={line}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {ticks.map((n) => (
          <span
            key={n}
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 border-l border-border/60"
            style={{left: `${(n / total) * 100}%`}}>
            <span className="absolute bottom-0.5 left-1 text-[10px] text-muted-foreground tabular-nums">
              {n}
            </span>
          </span>
        ))}

        {/* Everything outside the window is dimmed, so the window reads as lifted out. */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 bg-background/70"
          style={{width: `${left}%`}}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 bg-background/70"
          style={{width: `${100 - right}%`}}
        />

        <div
          onPointerDown={(event) => begin('move', event)}
          onPointerMove={shift}
          onPointerUp={finish}
          onPointerCancel={finish}
          className="absolute inset-y-0 cursor-grab border-y border-primary/40 bg-primary/5 active:cursor-grabbing"
          style={{left: `${left}%`, width: `${right - left}%`}}
        />
      </div>

      {(['start', 'end'] as const).map((which) => (
        <div
          key={which}
          role="slider"
          tabIndex={0}
          aria-label={which === 'start' ? startLabel : endLabel}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={(which === 'start' ? start : end) + 1}
          onPointerDown={(event) => begin(which, event)}
          onPointerMove={shift}
          onPointerUp={finish}
          onPointerCancel={finish}
          onKeyDown={(event) => nudge(which, event)}
          className="absolute top-1/2 z-10 flex h-7 w-3.5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center gap-px rounded-md border border-border bg-surface shadow-md ring-1 ring-foreground/10 outline-none transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring"
          style={{left: `${which === 'start' ? left : right}%`}}>
          <span className="h-3 w-px bg-muted-foreground" />
          <span className="h-3 w-px bg-muted-foreground" />
        </div>
      ))}
    </div>
  )
}
