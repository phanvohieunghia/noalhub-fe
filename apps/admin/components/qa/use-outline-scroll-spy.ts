'use client'

import {useEffect, useRef, useState} from 'react'

import type {OutlineEntry} from './table-of-contents'

/** A heading counts as reached once its top is this far (px) below the scroller's top edge. */
const REACHED = 80

/**
 * The `.ProseMirror` a scroll event belongs to. The editor's scroll surface is
 * the `.ProseMirror` element itself (`contentClassName` lands on it), so the
 * scroller usually *is* the editor; a wrapper around it (full screen) or the
 * page are the other cases.
 */
function editorOf(scroller: Element | Document): HTMLElement | null {
  if (scroller instanceof Element) {
    if (scroller.matches('.ProseMirror')) return scroller as HTMLElement
    return scroller.querySelector<HTMLElement>('.ProseMirror')
  }
  return document.querySelector<HTMLElement>('.ProseMirror')
}

const norm = (text: string | null | undefined) => (text ?? '').trim()

/**
 * The heading an outline entry points at. Titles repeat (two "Chương V" in a
 * row, or the same "Câu 1" under several parts), so a plain title lookup always
 * lands on the first one: the entry is matched as the N-th of its title, and the
 * heading as the N-th heading with that title. Falls back to position when the
 * document no longer has that many.
 */
export function findOutlineHeading(
  headings: readonly HTMLElement[],
  entries: readonly OutlineEntry[],
  index: number,
): HTMLElement | undefined {
  const title = norm(entries[index]?.title)
  const nth = entries
    .slice(0, index)
    .filter((entry) => norm(entry.title) === title).length
  const sameTitle = headings.filter((node) => norm(node.textContent) === title)
  return sameTitle[nth] ?? headings[index]
}

/** Inverse of `findOutlineHeading`: the entry index of the heading at `position`. */
function findOutlineEntry(
  headings: readonly HTMLElement[],
  entries: readonly OutlineEntry[],
  position: number,
): number {
  const title = norm(headings[position].textContent)
  const nth = headings
    .slice(0, position)
    .filter((node) => norm(node.textContent) === title).length
  let seen = 0
  for (let i = 0; i < entries.length; i += 1) {
    if (norm(entries[i].title) !== title) continue
    if (seen === nth) return i
    seen += 1
  }
  return -1
}

/**
 * Scroll-spy for an outline: the index of the entry whose heading last crossed
 * the top of the editor. `scroll` does not bubble, so one capturing listener on
 * the document covers the page, the inline editor and the full-screen one alike.
 *
 * The sidebar lists the last saved outline while the document may have moved
 * on, so entries match by title first and fall back to position among the
 * h2–h4 headings.
 */
export function useOutlineScrollSpy(
  entries: readonly OutlineEntry[] | undefined,
) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const entriesRef = useRef<readonly OutlineEntry[]>(entries ?? [])
  useEffect(() => {
    entriesRef.current = entries ?? []
  }, [entries])

  useEffect(() => {
    let frame = 0
    const measure = (scroller: Element | Document) => {
      const editor = editorOf(scroller)
      if (!editor) return
      const headings = Array.from(
        editor.querySelectorAll<HTMLElement>('h2, h3, h4'),
      )
      if (headings.length === 0) return
      const isElement = scroller instanceof Element
      const top = isElement ? scroller.getBoundingClientRect().top : 0
      const atEnd = isElement
        ? scroller.scrollTop + scroller.clientHeight >=
          scroller.scrollHeight - 2
        : window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2

      let current = 0
      headings.forEach((node, position) => {
        if (node.getBoundingClientRect().top - top <= REACHED)
          current = position
      })
      if (atEnd) current = headings.length - 1

      const list = entriesRef.current
      const byTitle = findOutlineEntry(headings, list, current)
      setActiveIndex(
        byTitle >= 0 ? byTitle : current < list.length ? current : null,
      )
    }

    const onScroll = (event: Event) => {
      const target = event.target
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() =>
        measure(target instanceof Element ? target : document),
      )
    }
    document.addEventListener('scroll', onScroll, true)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', onScroll, true)
    }
  }, [])

  return activeIndex
}
