'use client'

import {useEffect, useRef, useState} from 'react'

const drawn = new Map<string, Promise<string>>()
let counter = 0

/**
 * Draws Mermaid source to an SVG string. Loaded on demand and memoised per
 * (theme, source), so redrawing the same diagram (a re-render, a decoration pass in the
 * editor) costs nothing. Rejects when the source does not parse.
 */
export function renderMermaid(chart: string, dark: boolean): Promise<string> {
  const key = `${dark ? 'd' : 'l'}:${chart}`
  let svg = drawn.get(key)
  if (!svg) {
    svg = import('mermaid').then(async ({default: mermaid}) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: dark ? 'dark' : 'neutral',
      })
      counter += 1
      return (await mermaid.render(`mermaid-${counter}`, chart)).svg
    })
    // A failure is not worth remembering: fixing the source changes the key anyway, and a
    // retry (e.g. after the library failed to load) should get a fresh attempt.
    svg.catch(() => drawn.delete(key))
    drawn.set(key, svg)
  }
  return svg
}

/**
 * A ```mermaid code block drawn as a diagram.
 *
 * The one place a renderer here sets HTML by hand: Mermaid returns an SVG string and
 * has no element API. It is made safe at the source — `securityLevel: "strict"` makes
 * Mermaid run its own DOMPurify pass and turns off click handlers and inline HTML in
 * labels — and the input is the author's own text, already limited to a code block's
 * `text` nodes by `sanitizeBlogDoc`. The library is loaded on demand, so pages with no
 * diagram never download it.
 *
 * Until it has drawn (or if the source does not parse) the source stays on screen as a
 * plain code block, so a typo costs the picture, never the text.
 */
export function MermaidDiagram({chart}: {chart: string}) {
  const host = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const [drawn, setDrawn] = useState(false)
  // Redraw when the theme flips: Mermaid bakes its colours into the SVG.
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const read = () => setDark(root.classList.contains('dark'))
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, {attributes: true, attributeFilter: ['class']})
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    renderMermaid(chart, dark).then(
      (svg) => {
        if (cancelled || !host.current) return
        host.current.innerHTML = svg
        setDrawn(true)
        setFailed(false)
      },
      () => {
        if (!cancelled) setFailed(true)
      },
    )
    return () => {
      cancelled = true
    }
  }, [chart, dark])

  return (
    <>
      <div
        ref={host}
        role="img"
        aria-label={chart.split('\n')[0]}
        className="post-prose-mermaid"
        // `hidden` would lose to the stylesheet's `display:flex`.
        style={drawn ? undefined : {display: 'none'}}
      />
      {drawn && !failed ? null : (
        <pre tabIndex={0}>
          <code className="language-mermaid">{chart}</code>
        </pre>
      )}
    </>
  )
}
