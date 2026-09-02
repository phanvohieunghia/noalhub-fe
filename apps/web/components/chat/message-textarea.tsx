"use client";

import { forwardRef } from "react";

/**
 * A textarea that grows to `max-h-40` and only then scrolls internally.
 *
 * Auto-growing happens right in `onInput` by touching the style — NOT with
 * `useEffect` + `setState`: ESLint v16 has the
 * `react-hooks/set-state-in-effect` rule, and remeasuring a height is the DOM's
 * job, not state's.
 */
export const MessageTextarea = forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<"textarea">
>(function MessageTextarea({ onInput, className = "", ...props }, ref) {
  return (
    <textarea
      {...props}
      ref={ref}
      rows={1}
      onInput={(event) => {
        const node = event.currentTarget;
        node.style.height = "auto";
        node.style.height = `${node.scrollHeight}px`;
        onInput?.(event);
      }}
      className={`max-h-40 flex-1 resize-none rounded-md border border-black/15 bg-transparent px-3 py-2 text-body-3 outline-none focus:border-foreground/60 disabled:opacity-50 dark:border-white/20 ${className}`}
    />
  );
});
