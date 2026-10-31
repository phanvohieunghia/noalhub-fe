'use client'

import {useEffect, useState} from 'react'
import {Slider} from 'radix-ui'

import {Tooltip} from './tooltip'

/**
 * One thumb on a track of reachable `values` (not necessarily evenly spaced:
 * `[1, 2, …, 20, 30, 40, …, 100, 150, …]` gives fine steps where they matter and coarse
 * ones where they do not). Radix only knows one linear step, so the slider runs over
 * the *index* of the list and the value is read back from it — keyboard (arrows, Home/End),
 * `role="slider"` and touch come with Radix.
 *
 * Nothing is drawn but the track: the current value (`valueLabel`, already formatted by the
 * caller — this package pins no i18n namespace) appears in a tooltip over the thumb on hover,
 * focus and while dragging. `label` is not drawn either; it names the slider for assistive tech.
 */
export function ValueSlider({
  values,
  value,
  onValueChange,
  label,
  valueLabel,
  className = '',
}: {
  values: readonly number[]
  value: number
  onValueChange: (value: number) => void
  /** Names the slider for assistive tech; not drawn. */
  label: string
  /** The value as it should read next to the label ("600 questions"). */
  valueLabel: string
  className?: string
}) {
  const index = Math.max(
    0,
    values.reduce(
      (best, candidate, i) =>
        Math.abs(candidate - value) < Math.abs(values[best] - value) ? i : best,
      0,
    ),
  )

  // The value is shown in a tooltip over the thumb while it is hovered, focused or being
  // dragged. While a thumb is held the pointer leaves it, so it has to stay up by itself.
  const [hovered, setHovered] = useState(false)
  const [pressing, setPressing] = useState(false)
  useEffect(() => {
    if (!pressing) return
    const release = () => setPressing(false)
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
    }
  }, [pressing])

  return (
    <Slider.Root
      min={0}
      max={values.length - 1}
      step={1}
      value={[index]}
      onValueChange={([next]) => onValueChange(values[next])}
      onPointerDown={() => setPressing(true)}
      aria-label={label}
      className={`relative flex h-5 min-w-44 touch-none items-center select-none ${className}`}>
      <Slider.Track className="relative h-1.5 grow rounded-full bg-foreground/15">
        <Slider.Range className="absolute h-full rounded-full bg-primary" />
      </Slider.Track>
      <Tooltip
        label={valueLabel}
        open={hovered || pressing}
        onOpenChange={setHovered}
        delayMs={0}>
        <Slider.Thumb
          aria-label={label}
          className="block size-4 rounded-full border-2 border-primary bg-surface shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Tooltip>
    </Slider.Root>
  )
}
