'use client'

import {useEffect, useState} from 'react'

import {Button} from './button'
import {Icon, LUCIDE} from './icons'

/**
 * A floating button that returns the window to the top once it has scrolled past
 * `threshold` px. It sits in the bottom-right corner; a page with a bottom nav
 * should pass `className` to lift it clear.
 */
export function ScrollToTopButton({
  label,
  threshold = 200,
  className = '',
}: {
  /** The accessible name — pass a translated string. */
  label: string
  threshold?: number
  className?: string
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, {passive: true})
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  if (!visible) return null

  return (
    <Button
      variant="outline"
      size="icon"
      shape="circle"
      aria-label={label}
      className={`fixed right-4 bottom-6 z-20 bg-surface shadow-md ${className}`}
      onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
      <Icon icon={LUCIDE.arrowUp} />
    </Button>
  )
}
