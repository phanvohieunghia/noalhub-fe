"use client";

import { useEffect, useRef, useState } from "react";

import type { OutlineEntry } from "./table-of-contents";

/** A heading counts as reached once its top is this far (px) below the scroller's top edge. */
const REACHED = 80;

/**
 * The `.ProseMirror` a scroll event belongs to. The editor's scroll surface is
 * the `.ProseMirror` element itself (`contentClassName` lands on it), so the
 * scroller usually *is* the editor; a wrapper around it (full screen) or the
 * page are the other cases.
 */
function editorOf(scroller: Element | Document): HTMLElement | null {
  if (scroller instanceof Element) {
    if (scroller.matches(".ProseMirror")) return scroller as HTMLElement;
    return scroller.querySelector<HTMLElement>(".ProseMirror");
  }
  return document.querySelector<HTMLElement>(".ProseMirror");
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
export function useOutlineScrollSpy(entries: readonly OutlineEntry[] | undefined) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const entriesRef = useRef<readonly OutlineEntry[]>(entries ?? []);
  useEffect(() => {
    entriesRef.current = entries ?? [];
  }, [entries]);

  useEffect(() => {
    let frame = 0;
    const measure = (scroller: Element | Document) => {
      const editor = editorOf(scroller);
      if (!editor) return;
      const headings = Array.from(editor.querySelectorAll<HTMLElement>("h2, h3, h4"));
      if (headings.length === 0) return;
      const isElement = scroller instanceof Element;
      const top = isElement ? scroller.getBoundingClientRect().top : 0;
      const atEnd = isElement
        ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2
        : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

      let current = 0;
      headings.forEach((node, position) => {
        if (node.getBoundingClientRect().top - top <= REACHED) current = position;
      });
      if (atEnd) current = headings.length - 1;

      const title = headings[current].textContent?.trim();
      const list = entriesRef.current;
      const byTitle = list.findIndex((entry) => entry.title.trim() === title);
      setActiveIndex(byTitle >= 0 ? byTitle : current < list.length ? current : null);
    };

    const onScroll = (event: Event) => {
      const target = event.target;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => measure(target instanceof Element ? target : document));
    };
    document.addEventListener("scroll", onScroll, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  return activeIndex;
}
