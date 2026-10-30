'use client'

import {Tabs as RadixTabs} from 'radix-ui'

export type TabItem<T extends string> = {value: T; label: React.ReactNode}

/**
 * A segmented tab bar: a muted track holding one pill per tab, the active one
 * lifted onto `surface`. It renders only the bar — the panel under it belongs to
 * the caller, which already holds `value` and picks what to show. That keeps the
 * bar usable when the two panels live in different places on the screen (the
 * list in a sidebar, the content in the main column).
 */
export function Tabs<T extends string>({
  value,
  onValueChange,
  items,
  label,
  className = '',
}: {
  value: T
  onValueChange: (value: T) => void
  items: readonly TabItem<T>[]
  /** Accessible name of the tab list. */
  label: string
  className?: string
}) {
  return (
    <RadixTabs.Root
      value={value}
      onValueChange={(next) => onValueChange(next as T)}>
      <RadixTabs.List
        aria-label={label}
        className={`flex gap-1 rounded-lg bg-muted p-1 ${className}`}>
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className="flex-1 rounded-md px-4 py-2 text-title-4 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=active]:bg-surface data-[state=active]:text-foreground">
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
    </RadixTabs.Root>
  )
}
