'use client'

import {useTranslations} from 'next-intl'
import {useCallback, useEffect, useRef, useState} from 'react'

import {Button} from '@noalhub/ui/button'
import {Icon, ICONS, LUCIDE} from '@noalhub/ui/icons'
import {Input} from '@noalhub/ui/input'
import {Typography} from '@noalhub/ui/typography'

const HIGHLIGHT = 'knowledge-search'
const HIGHLIGHT_ACTIVE = 'knowledge-search-active'
/** Past this many hits the count stops being useful and painting gets slow. */
const MAX_MATCHES = 500
const DEBOUNCE_MS = 200

/**
 * Case- and accent-blind, one output character per input character — so an index
 * in the folded string is an index in the original and a `Range` can be built from
 * it. (`ệ` decomposes to `e` + marks; taking the first code point keeps the length.)
 */
function fold(text: string) {
  let out = ''
  for (const ch of text) {
    const base = ch.normalize('NFD')[0] ?? ch
    out += base === 'đ' || base === 'Đ' ? 'd' : base.toLowerCase()
  }
  return out
}

function findRanges(root: HTMLElement, query: string): Range[] {
  const needle = fold(query.trim())
  if (!needle) return []
  const ranges: Range[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? ''
    // Surrogate pairs fold to one char but span two units; skip the rare node that has any.
    const folded = fold(text)
    if (folded.length !== text.length) continue
    let from = 0
    for (;;) {
      const at = folded.indexOf(needle, from)
      if (at === -1) break
      const range = document.createRange()
      range.setStart(node, at)
      range.setEnd(node, at + needle.length)
      ranges.push(range)
      if (ranges.length >= MAX_MATCHES) return ranges
      from = at + needle.length
    }
  }
  return ranges
}

/**
 * Find-in-page over what is rendered inside `ref`, in the browser only. Hits are
 * painted with the CSS Custom Highlight API — no DOM is rewritten, so the article's
 * markup, anchors and the table of contents stay as they are.
 */
export function useArticleSearch(ref: React.RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [ranges, setRanges] = useState<Range[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      const root = ref.current
      setRanges(root ? findRanges(root, query) : [])
      setActive(0)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [open, query, ref])

  // Paint, and bring the active hit into view.
  useEffect(() => {
    if (typeof CSS === 'undefined' || !('highlights' in CSS)) return
    CSS.highlights.delete(HIGHLIGHT)
    CSS.highlights.delete(HIGHLIGHT_ACTIVE)
    if (!open || ranges.length === 0) return
    CSS.highlights.set(HIGHLIGHT, new Highlight(...ranges))
    const current = ranges[active]
    if (current) {
      CSS.highlights.set(HIGHLIGHT_ACTIVE, new Highlight(current))
      current.startContainer.parentElement?.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      })
    }
    return () => {
      CSS.highlights.delete(HIGHLIGHT)
      CSS.highlights.delete(HIGHLIGHT_ACTIVE)
    }
  }, [open, ranges, active])

  const step = useCallback(
    (by: 1 | -1) =>
      setActive((index) =>
        ranges.length === 0 ? 0 : (index + by + ranges.length) % ranges.length,
      ),
    [ranges.length],
  )

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setRanges([])
  }, [])

  return {
    open,
    start: () => setOpen(true),
    close,
    query,
    setQuery,
    total: ranges.length,
    active,
    next: () => step(1),
    prev: () => step(-1),
  }
}

/** The bar that takes over the pinned header while searching. */
export function KnowledgeSearchBar({
  search,
}: {
  search: ReturnType<typeof useArticleSearch>
}) {
  const t = useTranslations('web.learn')
  const inputRef = useRef<HTMLInputElement>(null)
  const searched = search.query.trim() !== ''

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div className="min-w-0 flex-1">
        <Input
          ref={inputRef}
          size="sm"
          hideLabel
          label={t('knowledge.search')}
          type="search"
          leadingIcon={ICONS.search}
          placeholder={t('knowledge.searchPlaceholder')}
          value={search.query}
          onChange={(event) => search.setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              if (event.shiftKey) search.prev()
              else search.next()
            } else if (event.key === 'Escape') {
              search.close()
            }
          }}
        />
      </div>
      <Typography
        as="span"
        variant="body-4"
        className="shrink-0 text-muted-foreground tabular-nums">
        {searched
          ? search.total === 0
            ? t('knowledge.searchNone')
            : t('knowledge.searchCount', {
                current: search.active + 1,
                total: search.total,
              })
          : null}
      </Typography>
      <Button
        variant="ghost"
        size="icon"
        shape="circle"
        aria-label={t('knowledge.searchPrev')}
        disabled={search.total === 0}
        onClick={search.prev}>
        <Icon icon={LUCIDE.chevronUp} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        shape="circle"
        aria-label={t('knowledge.searchNext')}
        disabled={search.total === 0}
        onClick={search.next}>
        <Icon icon={LUCIDE.chevronDown} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        shape="circle"
        aria-label={t('knowledge.searchClose')}
        onClick={search.close}>
        <Icon icon={ICONS.close} />
      </Button>
    </div>
  )
}
