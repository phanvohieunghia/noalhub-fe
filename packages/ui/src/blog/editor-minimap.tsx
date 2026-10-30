'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import type {Editor} from '@tiptap/react'

/** One block of the document, drawn as a bar: where it sits and how wide it reads. */
type Bar = {
  top: number
  height: number
  indent: number
  width: number
  tone: Tone
}
type Tone = 'text' | 'heading' | 'media' | 'code'
type Metrics = {scrollTop: number; clientHeight: number; scrollHeight: number}

const TONES: Record<Tone, string> = {
  text: 'bg-foreground/25',
  heading: 'bg-foreground/60',
  media: 'bg-primary/40',
  code: 'bg-foreground/15',
}

const LIST_INDENT = 0.12
const MAX_BARS = 3000

function toneOf(tag: string): Tone {
  if (/^H[1-6]$/.test(tag)) return 'heading'
  if (tag === 'IMG' || tag === 'TABLE' || tag === 'FIGURE' || tag === 'HR')
    return 'media'
  if (tag === 'PRE') return 'code'
  return 'text'
}

/** Bars of one block; lists descend into their items so each keeps its own bar. */
function collect(
  el: Element,
  origin: number,
  scrollTop: number,
  indent: number,
  out: Bar[],
) {
  if (out.length >= MAX_BARS) return
  const tag = el.tagName
  if (tag === 'UL' || tag === 'OL') {
    for (const item of Array.from(el.children))
      collect(item, origin, scrollTop, indent + LIST_INDENT, out)
    return
  }
  if (tag === 'LI') {
    // An item holds its own text plus, maybe, a nested list.
    for (const child of Array.from(el.children))
      collect(child, origin, scrollTop, indent, out)
    if (el.children.length === 0) push(el, origin, scrollTop, indent, out)
    return
  }
  push(el, origin, scrollTop, indent, out)
}

function push(
  el: Element,
  origin: number,
  scrollTop: number,
  indent: number,
  out: Bar[],
) {
  const rect = el.getBoundingClientRect()
  if (rect.height === 0) return
  const length = (el.textContent ?? '').length
  const tone = toneOf(el.tagName)
  // A line holds roughly 90 characters; a short block reads as a short bar.
  const width = tone === 'text' ? Math.min(1, Math.max(0.2, length / 90)) : 1
  out.push({
    top: rect.top - origin + scrollTop,
    height: rect.height,
    indent,
    width: Math.max(0.1, width - indent),
    tone,
  })
}

/**
 * A scaled-down map of the editor's whole document, drawn beside it: a bar per
 * block (headings darker, images and tables tinted, code faint) and a slider for
 * the part on screen. Click or drag to scroll. It reads the editable surface
 * (`editor.view.dom`, the scroll container) and never touches the document.
 *
 * Renders nothing while the document fits without scrolling.
 */
export function EditorMinimap({editor}: {editor: Editor}) {
  const [bars, setBars] = useState<Bar[]>([])
  const [metrics, setMetrics] = useState<Metrics>({
    scrollTop: 0,
    clientHeight: 0,
    scrollHeight: 0,
  })
  const dragging = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const scroller = () => editor.view.dom as HTMLElement

  const readMetrics = useCallback(() => {
    const el = editor.view.dom as HTMLElement
    setMetrics({
      scrollTop: el.scrollTop,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
    })
  }, [editor])

  const readBars = useCallback(() => {
    const el = editor.view.dom as HTMLElement
    const out: Bar[] = []
    const origin = el.getBoundingClientRect().top
    for (const child of Array.from(el.children))
      collect(child, origin, el.scrollTop, 0, out)
    setBars(out)
    readMetrics()
  }, [editor, readMetrics])

  useEffect(() => {
    const el = editor.view.dom as HTMLElement
    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(readBars)
    }
    schedule()
    editor.on('update', schedule)
    el.addEventListener('scroll', readMetrics, {passive: true})
    // Images settle their height after the document is already laid out.
    el.addEventListener('load', schedule, true)
    const resize = new ResizeObserver(schedule)
    resize.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      editor.off('update', schedule)
      el.removeEventListener('scroll', readMetrics)
      el.removeEventListener('load', schedule, true)
      resize.disconnect()
    }
  }, [editor, readBars, readMetrics])

  const {scrollTop, clientHeight, scrollHeight} = metrics
  if (scrollHeight <= clientHeight + 1 || clientHeight === 0) return null

  const scale = clientHeight / scrollHeight

  const scrollToY = (clientY: number) => {
    const root = rootRef.current
    if (!root) return
    const y = clientY - root.getBoundingClientRect().top
    scroller().scrollTop = y / scale - clientHeight / 2
  }

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="relative w-20 shrink-0 cursor-pointer touch-none self-start overflow-hidden rounded-md border border-border bg-surface select-none"
      style={{height: clientHeight}}
      onPointerDown={(event) => {
        dragging.current = true
        event.currentTarget.setPointerCapture(event.pointerId)
        scrollToY(event.clientY)
      }}
      onPointerMove={(event) => {
        if (dragging.current) scrollToY(event.clientY)
      }}
      onPointerUp={() => {
        dragging.current = false
      }}
      onPointerCancel={() => {
        dragging.current = false
      }}>
      {bars.map((bar, index) => (
        <div
          key={index}
          className={`absolute rounded-[1px] ${TONES[bar.tone]}`}
          style={{
            top: bar.top * scale,
            height: Math.max(1.5, bar.height * scale - 1),
            left: `${4 + bar.indent * 72}px`,
            width: `${bar.width * (100 - 8)}%`,
            maxWidth: `calc(100% - ${4 + bar.indent * 72}px - 4px)`,
          }}
        />
      ))}
      <div
        className="absolute inset-x-0 border-y border-primary/50 bg-primary/15"
        style={{
          top: scrollTop * scale,
          height: Math.max(8, clientHeight * scale),
        }}
      />
    </div>
  )
}
