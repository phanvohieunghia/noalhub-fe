'use client'

import {useEffect} from 'react'

const SIZE = 64

/**
 * Paints a dot on the top-right of the tab icon while `active`, so a long-running
 * generation is visible from another tab. The original icon is restored on cleanup.
 */
export function useFaviconBadge(active: boolean) {
  useEffect(() => {
    if (!active) return
    const links = Array.from(
      document.head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'),
    )
    const source = links[0]?.href
    if (!source) return

    const originals = links.map((link) => link.href)
    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (cancelled) return
      const canvas = document.createElement('canvas')
      canvas.width = SIZE
      canvas.height = SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(image, 0, 0, SIZE, SIZE)
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue('--warning')
        .trim()
      const radius = SIZE * 0.22
      const cx = SIZE - radius
      const cy = radius
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fillStyle = color || 'currentColor'
      ctx.fill()
      ctx.lineWidth = SIZE * 0.05
      ctx.strokeStyle = '#fff'
      ctx.stroke()
      const href = canvas.toDataURL('image/png')
      for (const link of links) link.href = href
    }
    image.src = source

    return () => {
      cancelled = true
      links.forEach((link, index) => {
        link.href = originals[index]!
      })
    }
  }, [active])
}
