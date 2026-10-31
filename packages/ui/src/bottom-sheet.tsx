'use client'

import {Dialog as RadixDialog} from 'radix-ui'

import {DRAWER_EXIT_MS, useAnimatedClose} from './dialog'

/**
 * A **bottom sheet**: a panel that rises from the bottom edge with rounded top corners and a
 * small grab handle, the way a phone shows a menu or a set of options. It is what a popover or
 * a modal turns into on a narrow screen, where a floating box over the page is hard to reach
 * and harder to read.
 *
 * Built on Radix Dialog like `Dialog` and `Drawer` (focus trap, `Esc`, scroll lock, portal),
 * and slides out before it unmounts, via the same `useAnimatedClose`. It has no title bar:
 * `title` is only the accessible name, and tapping the dimmed area closes it.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  /** The accessible name; not drawn. */
  title: string
  children: React.ReactNode
}) {
  const {closing, requestClose} = useAnimatedClose(onClose, DRAWER_EXIT_MS)

  return (
    <RadixDialog.Root
      open={open && !closing}
      onOpenChange={(next) => !next && requestClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
        <RadixDialog.Content
          aria-describedby={undefined}
          // Focus the sheet itself, not the first control in it (which would show its focus ring).
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            ;(event.currentTarget as HTMLElement | null)?.focus()
          }}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl bg-background text-foreground shadow-xl focus:outline-none data-[state=closed]:animate-slide-out-bottom data-[state=open]:animate-slide-in-bottom">
          <RadixDialog.Title className="sr-only">{title}</RadixDialog.Title>
          <span
            aria-hidden
            className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-border"
          />
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
