'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import type {BlogDoc} from '@noalhub/api/blog'
import {collectHeadings, TOC_MIN_HEADINGS} from '@noalhub/core/blog/headings'
import {useTranslations} from 'next-intl'

import {Typography} from '../typography'

/** A heading counts as "reached" once its top passes this line (px from the viewport top). */
const ACTIVE_OFFSET = 112

/**
 * A table of contents built **straight from the JSON** — no backend call, no
 * HTML parsing (§3.3).
 *
 * It shares `collectHeadings` with the renderer, so every `href="#id"` here
 * matches the `id` the renderer puts in the DOM — including when a post has two
 * headings with the same text and the ids need a suffix.
 *
 * While the page scrolls, the heading being read is highlighted, and the list
 * scrolls itself to keep that entry in view (it only needs to when the caller
 * made it a fixed-height, scrollable box through `className`).
 */
export function TableOfContents({
  doc,
  className = '',
}: {
  doc: BlogDoc
  className?: string
}) {
  // `common`: this component is used both on the post page (web) and in the
  // editor's preview tab (admin), so it must not pin one app's namespace (§6).
  const t = useTranslations('common')
  const headings = useMemo(() => collectHeadings(doc), [doc])
  const [activeId, setActiveId] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)

  const enabled = headings.length >= TOC_MIN_HEADINGS

  // Scroll-spy: the active heading is the last one above the offset line; at the
  // very bottom of the page the last heading wins, since a short final section
  // may never reach the line.
  useEffect(() => {
    if (!enabled) return
    let frame = 0

    const update = () => {
      frame = 0
      let current = headings[0]?.id ?? null
      for (const heading of headings) {
        const el = document.getElementById(heading.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= ACTIVE_OFFSET)
          current = heading.id
        else break
      }
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2
      if (atBottom && window.scrollY > 0)
        current = headings[headings.length - 1].id
      setActiveId(current)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    schedule()
    window.addEventListener('scroll', schedule, {passive: true})
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [enabled, headings])

  // Follow the highlight inside the list. Done by hand instead of
  // `scrollIntoView`, which would also drag the page along.
  useEffect(() => {
    const nav = navRef.current
    if (!nav || !activeId || nav.scrollHeight <= nav.clientHeight) return
    const link = nav.querySelector<HTMLElement>(
      `[data-toc-id="${CSS.escape(activeId)}"]`,
    )
    if (!link) return
    const navBox = nav.getBoundingClientRect()
    const linkBox = link.getBoundingClientRect()
    const margin = 48
    if (
      linkBox.top < navBox.top + margin ||
      linkBox.bottom > navBox.bottom - margin
    ) {
      nav.scrollTo({
        top: nav.scrollTop + (linkBox.top - navBox.top) - nav.clientHeight / 3,
        behavior: 'smooth',
      })
    }
  }, [activeId])

  // A two-line table of contents is just clutter (§3.3).
  if (!enabled) return null

  return (
    <nav
      ref={navRef}
      aria-labelledby="toc-heading"
      className={`rounded-lg border border-black/10 p-4 text-body-3 dark:border-white/15 ${className}`}>
      <Typography
        variant="body-4"
        weight={500}
        as="h2"
        id="toc-heading"
        className="uppercase tracking-wide opacity-60">
        {t('tocHeading')}
      </Typography>
      <ol className="mt-2 flex flex-col gap-1.5">
        {headings.map((heading) => {
          const active = heading.id === activeId
          return (
            <li
              key={heading.id}
              className={
                heading.level === 4
                  ? 'pl-8'
                  : heading.level === 3
                    ? 'pl-4'
                    : undefined
              }>
              <a
                href={`#${heading.id}`}
                data-toc-id={heading.id}
                aria-current={active ? 'location' : undefined}
                className={`hover:underline ${
                  active
                    ? 'font-semibold text-primary opacity-100'
                    : 'opacity-80 hover:opacity-100'
                }`}>
                {heading.text}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
