'use client'

import {DropdownMenu as RadixDropdownMenu} from 'radix-ui'

import {Icon} from './icons'

type DropdownMenuProps = {
  /** The element that opens the menu — passed through `asChild`, so give exactly one element. */
  trigger: React.ReactNode
  children: React.ReactNode
  /** Which edge of the trigger to align to. Defaults to the right: the account menu sits in the right corner. */
  align?: 'start' | 'center' | 'end'
  className?: string
  /** Tight padding and a minimum width — for action menus whose items carry their own padding. */
  compact?: boolean
}

/**
 * A dropdown built on Radix DropdownMenu: outside clicks, `Esc`, keyboard
 * navigation, `aria-expanded` and viewport-aware positioning all come for free.
 *
 * `modal={false}` keeps the page scrollable while the menu is open — this menu
 * is a header affordance, not a modal.
 */
export function DropdownMenu({
  trigger,
  children,
  align = 'end',
  className = '',
  compact = false,
}: DropdownMenuProps) {
  return (
    <RadixDropdownMenu.Root modal={false}>
      <RadixDropdownMenu.Trigger asChild>{trigger}</RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content
          align={align}
          sideOffset={compact ? 4 : 8}
          className={`z-50 rounded-lg border border-border bg-surface text-surface-foreground shadow-lg focus:outline-none ${
            compact ? 'min-w-44 p-1' : 'p-3'
          } ${className}`}>
          {children}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  )
}

/**
 * One clickable row in the menu. Radix handles keyboard/mouse highlighting via
 * `data-highlighted` and closes the menu after a selection.
 */
export function DropdownMenuItem({
  children,
  onSelect,
  disabled,
  icon,
  tone = 'default',
  className = '',
}: {
  children: React.ReactNode
  onSelect?: () => void
  disabled?: boolean
  /** An iconify name drawn before the label at 16px — every action in a row menu carries one. */
  icon?: string
  /** `danger` for the destructive action: the text and icon turn red. */
  tone?: 'default' | 'danger'
  className?: string
}) {
  return (
    <RadixDropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-body-3 outline-none select-none data-disabled:opacity-50 data-highlighted:bg-muted ${
        tone === 'danger' ? 'text-danger' : ''
      } ${className}`}>
      {icon ? <Icon icon={icon} className="size-4 shrink-0" /> : null}
      {children}
    </RadixDropdownMenu.Item>
  )
}

export function DropdownMenuSeparator() {
  return <RadixDropdownMenu.Separator className="my-2 h-px bg-border" />
}
