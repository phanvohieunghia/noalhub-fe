'use client'

import {useState} from 'react'

import {Icon, LUCIDE} from '@noalhub/ui/icons'
import {Tooltip} from '@noalhub/ui/tooltip'

/**
 * An info icon that carries a page description in a tooltip: hover/focus on
 * desktop, tap on touch (Radix ignores touch, so `open` is driven by hand).
 */
export function InfoTip({text}: {text: string}) {
  const [hover, setHover] = useState(false)
  const [tapped, setTapped] = useState(false)

  return (
    <Tooltip
      label={text}
      side="bottom"
      open={hover || tapped}
      onOpenChange={(next) => {
        setHover(next)
        if (!next) setTapped(false)
      }}>
      <button
        type="button"
        aria-label={text}
        onClick={() => setTapped((v) => !v)}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <Icon icon={LUCIDE.info} className="size-4" />
      </button>
    </Tooltip>
  )
}
