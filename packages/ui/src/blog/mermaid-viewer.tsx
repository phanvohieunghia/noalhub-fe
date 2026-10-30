'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'

import {Button} from '../button'
import {Dialog} from '../dialog'
import {Icon, LUCIDE} from '../icons'
import {Typography} from '../typography'
import {renderMermaid} from './mermaid-diagram'

const MIN = 0.25
const MAX = 4
const STEP = 1.25

/**
 * A diagram at full size, filling the screen, with zoom: buttons, Ctrl/⌘ + wheel (or a
 * trackpad pinch), and drag to pan. The picture is laid out at the diagram's own width
 * times the zoom, inside a scroll box, so panning is just scrolling.
 */
export function MermaidViewer({
  chart,
  onClose,
}: {
  chart: string
  onClose: () => void
}) {
  const t = useTranslations('common.editor')
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const scroller = useRef<HTMLDivElement>(null)
  const picture = useRef<HTMLDivElement>(null)
  const drag = useRef<{x: number; y: number; left: number; top: number} | null>(
    null,
  )

  useEffect(() => {
    let cancelled = false
    renderMermaid(
      chart,
      document.documentElement.classList.contains('dark'),
    ).then(
      (next) => !cancelled && setSvg(next),
      (failure: unknown) =>
        !cancelled &&
        setError(
          failure instanceof Error
            ? failure.message.split('\n')[0]
            : t('mermaidInvalid'),
        ),
    )
    return () => {
      cancelled = true
    }
  }, [chart, t])

  useEffect(() => {
    if (picture.current) picture.current.innerHTML = svg ?? ''
  }, [svg])

  // The diagram's own width, from its viewBox: zoom 1 is "as drawn", not "as wide as the screen".
  const natural = useMemo(() => {
    const box = svg?.match(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+) [\d.]+"/)
    return box ? Number(box[1]) : 800
  }, [svg])

  const zoomBy = (factor: number) =>
    setZoom((now) => Math.min(MAX, Math.max(MIN, now * factor)))

  // A wheel listener must be non-passive to cancel the page zoom a pinch would trigger.
  useEffect(() => {
    const element = scroller.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      zoomBy(event.deltaY < 0 ? STEP : 1 / STEP)
    }
    element.addEventListener('wheel', onWheel, {passive: false})
    return () => element.removeEventListener('wheel', onWheel)
  })

  return (
    <Dialog
      open
      size="fullscreen"
      onClose={onClose}
      title={t('mermaidPreview')}>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label={t('mermaidZoomOut')}
          onClick={() => zoomBy(1 / STEP)}>
          <Icon icon={LUCIDE.zoomOut} />
        </Button>
        <Typography
          variant="body-3"
          as="span"
          className="w-14 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </Typography>
        <Button
          variant="outline"
          size="icon"
          aria-label={t('mermaidZoomIn')}
          onClick={() => zoomBy(STEP)}>
          <Icon icon={LUCIDE.zoomIn} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={t('mermaidZoomReset')}
          onClick={() => setZoom(1)}>
          <Icon icon={LUCIDE.rotateCcw} />
        </Button>
      </div>
      <div
        ref={scroller}
        className="min-h-0 flex-1 cursor-grab overflow-auto rounded-md border border-border bg-surface p-4 active:cursor-grabbing"
        onPointerDown={(event) => {
          const element = scroller.current
          if (!element) return
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            left: element.scrollLeft,
            top: element.scrollTop,
          }
          element.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          const start = drag.current
          const element = scroller.current
          if (!start || !element) return
          element.scrollLeft = start.left - (event.clientX - start.x)
          element.scrollTop = start.top - (event.clientY - start.y)
        }}
        onPointerUp={() => {
          drag.current = null
        }}>
        {error ? (
          <Typography variant="body-3" className="text-danger">
            {error}
          </Typography>
        ) : (
          <div
            ref={picture}
            // Overrides the diagram's own max-width/height caps: here the zoom decides the size.
            className="mx-auto [&_svg]:h-auto [&_svg]:max-h-none [&_svg]:max-w-none [&_svg]:w-full"
            style={{width: natural * zoom}}
          />
        )}
      </div>
    </Dialog>
  )
}
