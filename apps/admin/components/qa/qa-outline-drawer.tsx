'use client'

import {useEffect, useRef, useState} from 'react'
import {Icon, LUCIDE} from '@noalhub/ui/icons'

const CLOSE_DELAY_MS = 200

/**
 * The column the outline sits in. From `lg` up it is a plain grid cell. Below
 * `lg` there is no room for a second column, so it becomes a drawer parked
 * off the right edge: a small tab stays visible as the hint that something
 * lives there, and hovering the tab (or the screen edge it sits on) slides the
 * panel in. On phones the tab is a larger solid-primary button, and tapping
 * it toggles the drawer (touch has no hover); Esc, a tap
 * outside, or leaving the panel closes it.
 */
export function QaOutlineDrawer({
  label,
  children,
}: {
  /** Accessible name of the tab that opens the drawer. */
  label: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }
  const openNow = () => {
    cancelClose()
    setOpen(true)
  }
  const closeSoon = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }

  useEffect(() => cancelClose, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <>
      {/* Phones: a floating button (outside the drawer, whose transform would
          otherwise become the containing block of a `fixed` child) plus a scrim
          while the drawer is open. */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-30 bg-foreground/30 transition-opacity duration-300 motion-reduce:transition-none md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={`fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg outline-none transition-[transform,opacity,background-color] duration-300 ease-out hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 motion-reduce:transition-none md:hidden ${
          open ? 'pointer-events-none scale-75 opacity-0' : ''
        }`}>
        <Icon icon={LUCIDE.listTree} className="size-6" />
      </button>
      <div
        ref={rootRef}
        // Mouse only: a tap fires emulated mouse events too, and the hover-open
        // would then be undone by the button's own click toggle.
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') openNow()
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') closeSoon()
        }}
        onFocus={openNow}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) closeSoon()
        }}
        className={`relative max-lg:fixed max-lg:inset-y-4 max-lg:right-0 max-lg:z-40 max-lg:w-[min(20rem,85vw)] max-lg:transition-[transform,box-shadow,visibility] max-lg:will-change-transform motion-reduce:transition-none lg:h-0 lg:min-h-full ${
          open
            ? 'max-lg:translate-x-0 max-lg:shadow-xl max-lg:duration-400 max-lg:ease-[cubic-bezier(0.22,1,0.36,1)]'
            : 'max-lg:invisible max-lg:translate-x-full max-lg:shadow-none max-lg:duration-250 max-lg:ease-[cubic-bezier(0.4,0,0.6,1)]'
        }`}>
        <button
          type="button"
          aria-label={label}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="visible absolute right-full top-1/2 hidden h-14 w-7 -translate-y-1/2 items-center justify-center rounded-l-lg border border-r-0 border-border bg-surface text-muted-foreground shadow-md outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring md:flex lg:hidden">
          <Icon
            icon={LUCIDE.listTree}
            className={`size-4 transition-[transform,color] duration-300 ease-out ${open ? 'scale-110 text-primary' : ''}`}
          />
        </button>
        {/* Fades with the slide. It is the content, not the wrapper, that fades:
          opacity on the wrapper would take the tab with it. */}
        <div
          className={`h-full max-lg:transition-opacity max-lg:duration-300 motion-reduce:transition-none ${
            open ? '' : 'max-lg:opacity-0'
          }`}>
          {children}
        </div>
      </div>
    </>
  )
}
