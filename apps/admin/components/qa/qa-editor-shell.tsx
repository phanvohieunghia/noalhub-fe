'use client'

import {useTranslations} from 'next-intl'
import {useEffect, useLayoutEffect, useRef, useState} from 'react'

import type {EditorFullscreen} from '@noalhub/ui/blog/tiptap-editor'
import {Button} from '@noalhub/ui/button'
import {Dialog} from '@noalhub/ui/dialog'
import {Icon, ICONS} from '@noalhub/ui/icons'
import {Switch} from '@noalhub/ui/switch'
import {Tooltip} from '@noalhub/ui/tooltip'
import {Typography} from '@noalhub/ui/typography'

/**
 * The card every markdown editor sits in: a title on the left, a format switch,
 * an icon Save (tooltip names the shortcut) and a full-screen button on the right,
 * then the editor. ⌘S / Ctrl+S saves from here too, so no caller wires its own.
 *
 * The editor itself is supplied as a render function because both editors read
 * their `value` on mount only — entering or leaving full screen remounts it, so it
 * picks up whatever the parent holds at that moment. The parent owns the text;
 * nothing is lost by the remount.
 */
export function EditorShell({
  title,
  fullscreenTitle,
  switchLabel,
  switchOn,
  onSwitchChange,
  onSave,
  saving,
  canSave,
  error,
  fill = false,
  grow = false,
  collapsed = false,
  meta,
  actions,
  renderEditor,
}: {
  title: React.ReactNode
  /** The title text shown in the full-screen window, where `title` may be a picker. */
  fullscreenTitle: string
  /** Omit all three for an editor with a single mode. */
  switchLabel?: string
  switchOn?: boolean
  onSwitchChange?: (on: boolean) => void
  onSave: () => void
  saving: boolean
  canSave: boolean
  error?: string | null
  /** Stretch the inline editor to the bottom of the viewport instead of a fixed scrollbox. */
  fill?: boolean
  /** Size the inline editor off the caller's `--fit-h` (a scrollbox that fits inside it, toolbar always in view) instead of the viewport. */
  grow?: boolean
  /** Fold the body away (animated), leaving the header. The editor stays mounted, so nothing typed is lost. */
  collapsed?: boolean
  /** A quiet readout beside Save, e.g. a word count. Shown inline and in full screen. */
  meta?: React.ReactNode
  /** Extra controls placed before Save in the header, e.g. a version or actions menu. */
  actions?: React.ReactNode
  /**
   * `className` is the editable surface's size: a scrollbox inline, taller in full
   * screen. `fullscreen` goes to the editor, which draws the toggle as the first
   * button of its own toolbar.
   */
  renderEditor: (options: {
    className: string
    fullscreen: EditorFullscreen
  }) => React.ReactNode
}) {
  const tc = useTranslations('common')
  const [full, setFull] = useState(false)
  const [generation, setGeneration] = useState(0)

  // `fill`: the editable surface (marked `qa-fit`) keeps its content height and is
  // capped at the bottom of the viewport, so it only scrolls once it would run past.
  // The cap is measured from wherever the surface actually sits — a guessed
  // `calc(100dvh - Nrem)` drifts the moment anything above it changes height.
  // Not re-measured on scroll (the measurement itself is scroll-independent, see
  // below): the page could otherwise be scrolled forever.
  const inlineRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const wrapper = inlineRef.current
    if (!fill || !wrapper) return
    const fit = () => {
      const surface = wrapper.querySelector<HTMLElement>('.qa-fit')
      if (!surface) return
      // Measured as if the page were scrolled to the top: `fit` also runs on layout
      // changes, and a scrolled `top` would make the surface grow with every run.
      let scrolled = window.scrollY
      for (
        let node: HTMLElement | null = surface.parentElement;
        node;
        node = node.parentElement
      ) {
        scrolled += node.scrollTop
      }
      const top = surface.getBoundingClientRect().top + scrolled
      surface.style.maxHeight = `${Math.max(window.innerHeight - top - 48, 240)}px`
    }
    fit()
    // The editor mounts its surface a beat after this shell does.
    const observer = new MutationObserver(fit)
    observer.observe(wrapper, {childList: true, subtree: true})
    window.addEventListener('resize', fit)
    // A sibling shell collapsing or expanding moves this one without re-rendering it,
    // so its `top` changes under a stale height; the page height changes with it.
    // The page itself may not change height (inner scroll containers), so watch every
    // ancestor, and re-measure once a collapse transition settles.
    const layoutObserver = new ResizeObserver(fit)
    for (
      let node: HTMLElement | null = wrapper.parentElement;
      node;
      node = node.parentElement
    ) {
      layoutObserver.observe(node)
    }
    document.addEventListener('transitionend', fit)
    return () => {
      document.removeEventListener('transitionend', fit)
      observer.disconnect()
      layoutObserver.disconnect()
      window.removeEventListener('resize', fit)
    }
  })

  // ⌘S / Ctrl+S saves instead of opening the browser's "save page" dialog. The
  // latest props are read through a ref so the listener binds once.
  const latest = useRef({onSave, canSave, saving})
  useEffect(() => {
    latest.current = {onSave, canSave, saving}
  })
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's')
        return
      event.preventDefault()
      const {onSave: save, canSave: ok, saving: busy} = latest.current
      if (ok && !busy) save()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const shortcut =
    typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
      ? '⌘S'
      : 'Ctrl+S'

  const toggleFull = (next: boolean) => {
    setFull(next)
    setGeneration((value) => value + 1)
  }

  const controls = (
    <>
      {meta}
      {switchLabel && onSwitchChange ? (
        <>
          <Typography variant="body-4" className="text-muted-foreground">
            {switchLabel}
          </Typography>
          <Switch
            aria-label={switchLabel}
            checked={switchOn}
            onCheckedChange={onSwitchChange}
          />
        </>
      ) : null}
      {actions}
      <Tooltip label={`${tc('actions.save')} (${shortcut})`} side="bottom">
        {/* The span takes the hover: a disabled button swallows pointer events. */}
        <span className="inline-flex">
          <Button
            size="icon-md"
            disabled={!canSave}
            loading={saving}
            aria-label={tc('actions.save')}
            aria-keyshortcuts="Meta+S Control+S"
            onClick={onSave}>
            <Icon icon={ICONS.save} />
          </Button>
        </span>
      </Tooltip>
    </>
  )

  return (
    <>
      <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <div className="min-w-0 flex-1">{title}</div>
          {controls}
        </div>
        {/* 0fr → 1fr animates the height without measuring it. */}
        <div
          className={`grid transition-[grid-template-rows] duration-250 ease-out ${
            collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
          }`}>
          <div className="min-h-0 overflow-hidden" inert={collapsed}>
            <div className="h-px bg-border" />
            <div className="flex flex-col gap-3 p-4">
              {error ? (
                <Typography
                  variant="body-4"
                  className="text-danger"
                  role="alert">
                  {error}
                </Typography>
              ) : null}
              {full ? null : (
                <div key={`inline-${generation}`} ref={inlineRef}>
                  {renderEditor({
                    className: grow
                      ? 'min-h-[240px] max-h-[calc(var(--fit-h,70vh)-12rem)] overflow-y-auto overscroll-contain'
                      : fill
                        ? 'qa-fit min-h-[240px] overflow-y-auto overscroll-contain'
                        : 'min-h-[420px] max-h-[640px] overflow-y-auto',
                    fullscreen: {
                      active: false,
                      onToggle: () => toggleFull(true),
                    },
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {full ? (
        <Dialog
          open
          size="inset"
          hideClose
          title={fullscreenTitle}
          onClose={() => toggleFull(false)}
          actions={controls}>
          <div
            key={`full-${generation}`}
            className="flex min-h-0 flex-1 flex-col">
            {renderEditor({
              // The scrollbox is the editable surface itself, so the toolbar above it
              // stays in view while a long document scrolls.
              className: 'h-full overflow-y-auto',
              fullscreen: {active: true, onToggle: () => toggleFull(false)},
            })}
          </div>
        </Dialog>
      ) : null}
    </>
  )
}
