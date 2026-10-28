"use client";

import { HoverCard } from "radix-ui";
import { useState } from "react";

import { Typography } from "./typography";

/**
 * A floating panel beside its trigger, opened on hover/focus. Radix HoverCard keeps it open
 * while the pointer crosses the gap between the icon and the panel, which a
 * plain CSS `:hover` flyout loses. `open` is controlled only so keyboard focus
 * on the icon can open it too (HoverCard is pointer-only by default).
 */
export function HoverFlyout({
  label,
  trigger,
  children,
  side = "right",
  align = "start",
  contentClassName = "min-w-44 p-1.5",
  canOpen,
}: {
  /** A small heading above the content; leave it out for a bare card. */
  label?: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Sizing and padding of the card; replaces the menu-sized default. */
  contentClassName?: string;
  /** Asked on every hover/focus; return `false` to keep the card shut (e.g. nothing is cut off). */
  canOpen?: () => boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <HoverCard.Root open={open} onOpenChange={(next) => setOpen(next && (canOpen?.() ?? true))} openDelay={80} closeDelay={150}>
      <HoverCard.Trigger
        asChild
        onFocus={() => setOpen(canOpen?.() ?? true)}
        onBlur={() => setOpen(false)}
      >
        {trigger}
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={8}
          className={`z-50 rounded-lg border border-border bg-surface text-foreground shadow-lg ${contentClassName}`}
        >
          {label ? (
            <Typography variant="body-4" weight={600} className="px-3 pt-1 pb-1.5 text-muted-foreground">
              {label}
            </Typography>
          ) : null}
          {children}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
