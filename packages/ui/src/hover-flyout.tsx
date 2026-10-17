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
}: {
  label: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <HoverCard.Root open={open} onOpenChange={setOpen} openDelay={80} closeDelay={150}>
      <HoverCard.Trigger
        asChild
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {trigger}
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="right"
          align="start"
          sideOffset={8}
          collisionPadding={8}
          className="z-50 min-w-44 rounded-lg border border-border bg-surface p-1.5 shadow-lg"
        >
          <Typography variant="body-4" weight={600} className="px-3 pt-1 pb-1.5 text-muted-foreground">
            {label}
          </Typography>
          {children}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
