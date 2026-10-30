'use client'

import {useRef, type KeyboardEvent, type PointerEvent} from 'react'
import {Icon, ICONS} from '@noalhub/ui/icons'

const KEY_STEP = 16

/**
 * Full-height hover strip on the left edge of its (relatively positioned) parent; the grip pill only shows while the
 * edge is hovered, focused or dragged. Dragging it (or ←/→ when focused) resizes the column on its **right**: moving
 * left widens it, moving right narrows it.
 */
export function QaResizeHandle({
  width,
  min,
  max,
  label,
  onChange,
}: {
  width: number
  min: number
  max: number
  label: string
  onChange: (width: number) => void
}) {
  const drag = useRef<{x: number; width: number} | null>(null)
  const clamp = (value: number) => Math.min(max, Math.max(min, value))

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {x: event.clientX, width}
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    onChange(clamp(drag.current.width + drag.current.x - event.clientX))
  }
  const onPointerUp = () => {
    drag.current = null
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') onChange(clamp(width + KEY_STEP))
    else if (event.key === 'ArrowRight') onChange(clamp(width - KEY_STEP))
    else return
    event.preventDefault()
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={width}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className="group absolute inset-y-0 left-0 z-10 hidden w-4 -translate-x-1/2 cursor-col-resize touch-none select-none items-center justify-center focus-visible:outline-none lg:flex">
      <span className="flex h-9 w-5 items-center justify-center rounded-full border border-border bg-surface text-foreground opacity-0 transition group-hover:opacity-100 group-hover:border-primary group-hover:text-primary group-focus-visible:opacity-100 group-focus-visible:border-primary group-focus-visible:text-primary group-focus-visible:ring-2 group-focus-visible:ring-ring group-active:opacity-100 group-active:border-primary group-active:text-primary">
        <Icon icon={ICONS.drag} className="size-4" />
      </span>
    </div>
  )
}
