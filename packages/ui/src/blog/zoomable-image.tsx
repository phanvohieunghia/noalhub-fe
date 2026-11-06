'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'

import {Button} from '../button'
import {Dialog} from '../dialog'
import {Icon, LUCIDE} from '../icons'
import {Typography} from '../typography'

const MIN = 1
const MAX = 6
const STEP = 1.5

type View = {scale: number; x: number; y: number}
const HOME: View = {scale: 1, x: 0, y: 0}

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value))

/**
 * Wraps a post image so a tap opens it full screen, where two fingers pinch to
 * zoom, one finger drags the zoomed picture, a double tap toggles 1× / 2.5×, and
 * on a desktop the wheel, the buttons and a double click do the same. Children are
 * the already-rendered `next/image`, so server rendering and layout are untouched.
 */
export function ZoomableImage({
  src,
  alt,
  children,
}: {
  src: string
  alt: string
  children: React.ReactNode
}) {
  const t = useTranslations('common.imageViewer')
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label={alt ? `${t('open')}: ${alt}` : t('open')}
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in rounded-[inherit] focus-visible:outline-2 focus-visible:outline-ring">
        {children}
      </button>
      {open && (
        <ImageViewer src={src} alt={alt} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

function ImageViewer({
  src,
  alt,
  onClose,
}: {
  src: string
  alt: string
  onClose: () => void
}) {
  const t = useTranslations('common.imageViewer')
  const [view, setView] = useState<View>(HOME)
  const [moving, setMoving] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, {x: number; y: number}>())
  // What a pinch started from: the fingers' distance and the view at that moment.
  const pinch = useRef<{distance: number; view: View} | null>(null)
  const lastTap = useRef(0)

  /** The pan that keeps the picture from leaving the stage at this scale. */
  const keep = useCallback((next: View): View => {
    const box = stage.current
    if (!box) return next
    const scale = clamp(next.scale, MIN, MAX)
    const limitX = (box.clientWidth * (scale - 1)) / 2
    const limitY = (box.clientHeight * (scale - 1)) / 2
    return {
      scale,
      x: clamp(next.x, -limitX, limitX),
      y: clamp(next.y, -limitY, limitY),
    }
  }, [])

  /** Zoom to `scale`, keeping the point under (cx, cy) — relative to the stage centre — fixed. */
  const zoomAt = useCallback(
    (scale: number, cx: number, cy: number, from: View) => {
      const next = clamp(scale, MIN, MAX)
      const ratio = next / from.scale
      return keep({
        scale: next,
        x: cx - (cx - from.x) * ratio,
        y: cy - (cy - from.y) * ratio,
      })
    },
    [keep],
  )

  const centre = (event: {clientX: number; clientY: number}) => {
    const box = stage.current?.getBoundingClientRect()
    return box
      ? {
          x: event.clientX - box.left - box.width / 2,
          y: event.clientY - box.top - box.height / 2,
        }
      : {x: 0, y: 0}
  }

  // A wheel listener must be non-passive to stop the page scrolling under the viewer.
  useEffect(() => {
    const element = stage.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const point = centre(event)
      setView((now) =>
        zoomAt(
          now.scale * (event.deltaY < 0 ? 1.15 : 1 / 1.15),
          point.x,
          point.y,
          now,
        ),
      )
    }
    element.addEventListener('wheel', onWheel, {passive: false})
    return () => element.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  const distance = () => {
    const [a, b] = [...pointers.current.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  const onPointerDown = (event: React.PointerEvent) => {
    stage.current?.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, {x: event.clientX, y: event.clientY})
    setMoving(true)
    if (pointers.current.size === 2) {
      pinch.current = {distance: distance(), view}
    }
  }

  const onPointerMove = (event: React.PointerEvent) => {
    const previous = pointers.current.get(event.pointerId)
    if (!previous) return
    pointers.current.set(event.pointerId, {x: event.clientX, y: event.clientY})

    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()]
      const box = stage.current?.getBoundingClientRect()
      if (!box) return
      const mid = {
        x: (a.x + b.x) / 2 - box.left - box.width / 2,
        y: (a.y + b.y) / 2 - box.top - box.height / 2,
      }
      const start = pinch.current
      setView(
        zoomAt(
          start.view.scale * (distance() / start.distance),
          mid.x,
          mid.y,
          start.view,
        ),
      )
      return
    }

    const dx = event.clientX - previous.x
    const dy = event.clientY - previous.y
    setView((now) =>
      now.scale > 1 ? keep({...now, x: now.x + dx, y: now.y + dy}) : now,
    )
  }

  const onPointerUp = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId)
    pinch.current = null
    if (pointers.current.size === 1) {
      // One finger left after a pinch: carry on dragging from where the view is.
      pinch.current = null
    }
    if (pointers.current.size === 0) {
      setMoving(false)
      const now = event.timeStamp
      if (now - lastTap.current < 300) {
        const point = centre(event)
        setView((from) =>
          from.scale > 1 ? HOME : zoomAt(2.5, point.x, point.y, from),
        )
        lastTap.current = 0
      } else {
        lastTap.current = now
      }
    }
  }

  const zoomBy = (factor: number) =>
    setView((now) => zoomAt(now.scale * factor, 0, 0, now))

  return (
    <Dialog open size="fullscreen" onClose={onClose} title={t('title')}>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label={t('zoomOut')}
          disabled={view.scale <= MIN}
          onClick={() => zoomBy(1 / STEP)}>
          <Icon icon={LUCIDE.zoomOut} />
        </Button>
        <Typography
          variant="body-3"
          as="span"
          className="w-14 text-center tabular-nums">
          {Math.round(view.scale * 100)}%
        </Typography>
        <Button
          variant="outline"
          size="icon"
          aria-label={t('zoomIn')}
          disabled={view.scale >= MAX}
          onClick={() => zoomBy(STEP)}>
          <Icon icon={LUCIDE.zoomIn} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={t('zoomReset')}
          disabled={view.scale === 1}
          onClick={() => setView(HOME)}>
          <Icon icon={LUCIDE.rotateCcw} />
        </Button>
      </div>

      {/* `touch-action: none` hands every touch to the handlers: without it the
          browser would pan or page-zoom the viewer instead of the picture. */}
      <div
        ref={stage}
        className={`min-h-0 flex-1 touch-none overflow-hidden rounded-md bg-muted select-none ${
          view.scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}>
        {/* A plain <img>: the full-resolution original, from any allowed host. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="size-full object-contain"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transition: moving
              ? 'none'
              : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
    </Dialog>
  )
}
