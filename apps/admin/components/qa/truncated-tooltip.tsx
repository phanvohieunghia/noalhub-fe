'use client'

import {cloneElement, useRef, useState} from 'react'

import {Tooltip} from '@noalhub/ui/tooltip'

/**
 * A tooltip that only opens when the text it describes is actually cut off. Wraps one
 * element (a `Button`) that holds a `.truncate` child; on hover or focus it compares that
 * child's scroll width with its visible width, so a title that fits shows nothing.
 *
 * The tooltip is controlled rather than swapped for the bare child when nothing is cut
 * off: changing the wrapper would remount the button in the middle of the hover.
 */
export function TruncatedTooltip({
  label,
  children,
}: {
  label: string
  children: React.ReactElement<{ref?: React.Ref<HTMLElement>}>
}) {
  const ref = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)

  return (
    <Tooltip
      label={label}
      open={open}
      onOpenChange={(next) => {
        const text = ref.current?.querySelector<HTMLElement>('.truncate')
        setOpen(next && !!text && text.scrollWidth > text.clientWidth)
      }}>
      {cloneElement(children, {ref})}
    </Tooltip>
  )
}
