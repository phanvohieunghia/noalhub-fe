"use client";

import { DropdownMenu as RadixDropdownMenu } from "radix-ui";

type DropdownMenuProps = {
  /** The element that opens the menu — passed through `asChild`, so give exactly one element. */
  trigger: React.ReactNode;
  children: React.ReactNode;
  /** Which edge of the trigger to align to. Defaults to the right: the account menu sits in the right corner. */
  align?: "start" | "center" | "end";
  className?: string;
};

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
  align = "end",
  className = "",
}: DropdownMenuProps) {
  return (
    <RadixDropdownMenu.Root modal={false}>
      <RadixDropdownMenu.Trigger asChild>{trigger}</RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content
          align={align}
          sideOffset={8}
          className={`z-50 rounded-lg border border-border bg-surface p-3 text-surface-foreground shadow-lg focus:outline-none ${className}`}
        >
          {children}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  );
}

/**
 * One clickable row in the menu. Radix handles keyboard/mouse highlighting via
 * `data-highlighted` and closes the menu after a selection.
 */
export function DropdownMenuItem({
  children,
  onSelect,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <RadixDropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-body-3 outline-none select-none data-disabled:opacity-50 data-highlighted:bg-muted ${className}`}
    >
      {children}
    </RadixDropdownMenu.Item>
  );
}

export function DropdownMenuSeparator() {
  return <RadixDropdownMenu.Separator className="my-2 h-px bg-border" />;
}
