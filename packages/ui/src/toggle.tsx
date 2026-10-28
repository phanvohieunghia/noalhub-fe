"use client";

import { forwardRef } from "react";
import { ToggleGroup } from "radix-ui";

import { Icon } from "./icons";
import { Tooltip } from "./tooltip";
import type { IconName } from "./icons";

export type ToggleOption<T extends string = string> = {
  value: T;
  icon: IconName;
  /** Accessible name — the buttons carry no visible text, so this is required. */
  label: string;
};

type ToggleProps<T extends string> = {
  options: readonly ToggleOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** Names the group for screen readers, e.g. "View mode". */
  "aria-label": string;
  disabled?: boolean;
  className?: string;
  /** `pill` is the muted capsule; `outline` is a bordered box with square-cornered items; `filter` is the same box on a `background` track with a primary-filled active item, for filters inside a `surface` card (where `pill` and `outline` melt into the card). */
  variant?: "pill" | "outline" | "filter";
};

/**
 * A single-choice group of icon buttons (list / grid view, and the like), styled
 * like `ThemeToggle`: a muted pill with the picked option raised on a surface.
 *
 * Unlike `Switch` this is not an on/off state but a pick among 2+ options, so it
 * is built on Radix's ToggleGroup (`role="radiogroup"`, arrow-key roving focus).
 * Radix lets a pressed item be pressed again to clear the value; that is
 * swallowed here, because a view mode with nothing selected is not a state.
 */
function ToggleInner<T extends string>(
  {
    options,
    value,
    onValueChange,
    disabled,
    className = "",
    variant = "pill",
    ...props
  }: ToggleProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <ToggleGroup.Root
      ref={ref}
      type="single"
      value={value}
      disabled={disabled}
      aria-label={props["aria-label"]}
      onValueChange={(next) => {
        if (next) onValueChange(next as T);
      }}
      className={`inline-flex items-center ${
        variant === "filter"
          ? "gap-0.5 rounded-lg border border-border bg-background p-0.5"
          : variant === "outline"
            ? "gap-0.5 rounded-lg border border-border bg-surface p-0.5"
            : "overflow-clip rounded-full bg-muted p-0.5"
      } ${className}`}
    >
      {options.map((option) => (
        // The label shows as a tooltip on hover and focus rather than a native `title`,
        // which is slow to appear and never shows for the keyboard. The tooltip sits on a
        // wrapper: its trigger writes `data-state`, which on the item itself would
        // overwrite the `on` / `off` that the pressed styling reads.
        <Tooltip key={option.value} label={option.label}>
          <span className="inline-flex">
            <ToggleGroup.Item
              value={option.value}
              aria-label={option.label}
              className={`flex shrink-0 cursor-pointer items-center justify-center text-muted-foreground outline-none transition-colors
            hover:text-foreground
            focus-visible:ring-2 focus-visible:ring-ring
            disabled:cursor-not-allowed disabled:opacity-50
            ${
              variant === "filter"
                ? "size-6 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                : variant === "outline"
                  ? "size-6 rounded-md data-[state=on]:bg-muted data-[state=on]:text-foreground"
                  : "size-7 rounded-full data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=on]:ring-1 data-[state=on]:ring-border"
            }`}
            >
              <Icon
                icon={option.icon}
                className={`shrink-0 ${variant === "filter" ? "size-3.5" : "size-4"}`}
              />
            </ToggleGroup.Item>
          </span>
        </Tooltip>
      ))}
    </ToggleGroup.Root>
  );
}

/** `forwardRef` erases generics; the cast restores them for callers. */
export const Toggle = forwardRef(ToggleInner) as <T extends string>(
  props: ToggleProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement;
