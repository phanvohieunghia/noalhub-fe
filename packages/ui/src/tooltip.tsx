"use client";

import { Tooltip as RadixTooltip } from "radix-ui";

/**
 * A tooltip on hover **and** keyboard focus, built on Radix Tooltip.
 *
 * Preferred over the native `title` attribute wherever the text matters: `title`
 * appears only after a long, unconfigurable delay, is invisible to keyboard
 * users, and cannot be styled or read on touch.
 *
 * The Provider sits inside the component rather than at the app root: these
 * tooltips are used one at a time, and a root provider would be one more thing
 * every app (and every story) has to remember to mount. Nesting providers is
 * allowed by Radix, so wrapping a subtree in one later stays possible.
 */
export function Tooltip({
  label,
  children,
  side = "top",
  delayMs = 200,
}: {
  /** The text shown in the bubble. Empty renders the child on its own. */
  label: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayMs?: number;
}) {
  if (!label) return children;

  return (
    <RadixTooltip.Provider delayDuration={delayMs}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={6}
            collisionPadding={8}
            className="z-50 max-w-64 rounded-md bg-foreground px-2 py-1 text-body-4 text-background shadow-md data-[state=delayed-open]:animate-overlay-in data-[state=closed]:animate-overlay-out"
          >
            {label}
            <RadixTooltip.Arrow className="fill-foreground" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
