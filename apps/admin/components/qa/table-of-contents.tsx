'use client'

import {useTranslations} from 'next-intl'
import {useEffect, useMemo, useRef, useState} from 'react'

import {Typography} from '@noalhub/ui/typography'

import {TableOfContentsHeader} from './table-of-contents-header'
import {TableOfContentsItem} from './table-of-contents-item'

export type OutlineEntry = {
  anchor: string
  title: string
  level: number
  charCount: number
}

type Section = {entry: OutlineEntry; index: number; depth: 1 | 2}
type Chapter = {entry: OutlineEntry; index: number; children: Section[]}

/** A heading at h2 or above opens a chapter; h3 hangs under it (depth 1) and h4+ under that (depth 2). */
function groupChapters(entries: readonly OutlineEntry[]): Chapter[] {
  const chapters: Chapter[] = []
  entries.forEach((entry, index) => {
    const last = chapters[chapters.length - 1]
    if (entry.level <= 2 || !last) chapters.push({entry, index, children: []})
    else last.children.push({entry, index, depth: entry.level <= 3 ? 1 : 2})
  })
  return chapters
}

/** Chapter/section tree of a dataset outline (read-only; derived from the document headings). */
export function TableOfContents({
  entries,
  version,
  isCurrent,
  onSelect,
  activeIndex,
  className = '',
}: {
  entries: readonly OutlineEntry[]
  version: number
  isCurrent?: boolean
  onSelect: (index: number, title: string) => void
  /** The entry the reader is currently at (scroll-spy). Overrides the last clicked row while set. */
  activeIndex?: number | null
  className?: string
}) {
  const t = useTranslations('admin.qa')
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [clickedAnchor, setClickedAnchor] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const activeAnchor =
    activeIndex != null ? (entries[activeIndex]?.anchor ?? null) : clickedAnchor

  // Keep the highlighted row inside the panel's own scroller. Adjusting scrollTop
  // by hand (rather than scrollIntoView) leaves the page and the editor alone.
  useEffect(() => {
    const root = rootRef.current
    const row = root?.querySelector<HTMLElement>('[data-active="true"]')
    if (!root || !row || root.clientHeight === 0) return
    const rootBox = root.getBoundingClientRect()
    const rowBox = row.getBoundingClientRect()
    const margin = 48
    if (rowBox.top < rootBox.top + margin) {
      root.scrollTo({
        top: root.scrollTop + rowBox.top - rootBox.top - margin,
        behavior: 'smooth',
      })
    } else if (rowBox.bottom > rootBox.bottom - margin) {
      root.scrollTo({
        top: root.scrollTop + rowBox.bottom - rootBox.bottom + margin,
        behavior: 'smooth',
      })
    }
  }, [activeAnchor])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const chapters = useMemo(() => groupChapters(entries), [entries])
  const needle = query.trim().toLowerCase()
  const matches = (title: string) => title.toLowerCase().includes(needle)

  const toggle = (anchor: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(anchor)) next.delete(anchor)
      else next.add(anchor)
      return next
    })

  const select = (entry: OutlineEntry, index: number) => {
    setClickedAnchor(entry.anchor)
    onSelect(index, entry.title)
  }

  return (
    <div
      ref={rootRef}
      className={`rounded-lg border border-border bg-surface p-3 ${className}`}>
      <TableOfContentsHeader
        ref={searchRef}
        version={version}
        isCurrent={isCurrent}
        query={query}
        onQueryChange={setQuery}
      />

      <ol>
        {chapters.map(({entry, index, children}) => {
          const visibleChildren = needle
            ? children.filter((child) => matches(child.entry.title))
            : children
          if (needle && !matches(entry.title) && visibleChildren.length === 0)
            return null
          // A search always opens the chapters it matched inside.
          const open = needle ? true : !collapsed.has(entry.anchor)

          return (
            <li key={entry.anchor}>
              <TableOfContentsItem
                kind="chapter"
                title={entry.title}
                // A folded chapter stands in for the active row hidden inside it.
                active={
                  activeAnchor === entry.anchor ||
                  (!open &&
                    children.some(
                      (child) => child.entry.anchor === activeAnchor,
                    ))
                }
                open={open}
                expandable={children.length > 0}
                onToggle={() => toggle(entry.anchor)}
                onSelect={() => select(entry, index)}
              />

              {visibleChildren.length > 0 ? (
                // Always mounted so the height can animate: 0fr → 1fr lets the grid measure the
                // content. `inert` keeps a folded branch out of the tab order and a11y tree.
                <div
                  inert={!open}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                    open
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                  }`}>
                  <ol className="min-h-0 overflow-hidden">
                    {visibleChildren.map((child, position) => {
                      const rest = visibleChildren.slice(position + 1)
                      // A row ends its branch when no later sibling shares its level: for depth 1
                      // that skips over its own depth-2 children, for depth 2 the next row must climb.
                      const last =
                        child.depth === 1
                          ? !rest.some((row) => row.depth === 1)
                          : rest[0]?.depth !== 2
                      // A depth-2 row keeps its parent's line running while that parent has later siblings.
                      const trail =
                        child.depth === 2 && rest.some((row) => row.depth === 1)
                      return (
                        <li key={child.entry.anchor}>
                          <TableOfContentsItem
                            kind="section"
                            title={child.entry.title}
                            active={activeAnchor === child.entry.anchor}
                            depth={child.depth}
                            last={last}
                            trail={trail}
                            onSelect={() => select(child.entry, child.index)}
                          />
                        </li>
                      )
                    })}
                  </ol>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>

      {entries.length === 0 ? (
        <Typography variant="body-3" className="opacity-70">
          {t('outlines.noSections')}
        </Typography>
      ) : null}
    </div>
  )
}
