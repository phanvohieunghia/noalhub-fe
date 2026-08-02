"use client";

import { forwardRef } from "react";

/**
 * Textarea tự cao dần tới `max-h-40` rồi mới cuộn trong nó.
 *
 * Auto-grow làm ngay trong `onInput` bằng cách chạm style — KHÔNG dùng
 * `useEffect` + `setState`: ESLint v16 có rule `react-hooks/set-state-in-effect`,
 * và đo lại chiều cao là việc của DOM chứ không phải của state.
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
      className={`max-h-40 flex-1 resize-none rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/60 disabled:opacity-50 dark:border-white/20 ${className}`}
    />
  );
});
