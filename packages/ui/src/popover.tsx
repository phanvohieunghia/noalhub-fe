'use client'

import {Popover as RadixPopover} from 'radix-ui'

/**
 * A floating panel anchored to something, on Radix Popover: it opens over the page without
 * moving anything, closes on `Esc` or a click outside, and flips/shifts to stay on screen.
 *
 * Built from the parts Radix gives so the panel can hang from a wider element than the button
 * that opens it:
 *
 * ```tsx
 * <Popover open={open} onOpenChange={setOpen}>
 *   <PopoverAnchor asChild><div>…a toolbar…<PopoverTrigger asChild><Button/></PopoverTrigger></div></PopoverAnchor>
 *   <PopoverContent>…</PopoverContent>
 * </Popover>
 * ```
 *
 * Without an anchor the panel hangs from the trigger itself.
 */
export const Popover = RadixPopover.Root
export const PopoverAnchor = RadixPopover.Anchor
export const PopoverTrigger = RadixPopover.Trigger

export function PopoverContent({
  children,
  align = 'end',
  className = '',
}: {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        align={align}
        sideOffset={8}
        collisionPadding={16}
        // Not onto the first control inside: that lit up a slider's focus ring and tooltip the
        // moment the panel opened. Focus the panel itself; the keyboard tabs on from there.
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          ;(event.currentTarget as HTMLElement | null)?.focus()
        }}
        // `z-50` like the dialog it is usually opened from: it is portalled later, so it is on top.
        className={`z-50 max-h-[70dvh] overflow-y-auto rounded-xl border border-border bg-surface p-4 text-surface-foreground shadow-lg focus:outline-none ${className}`}>
        {children}
      </RadixPopover.Content>
    </RadixPopover.Portal>
  )
}
