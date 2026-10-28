"use client";

import { Button } from "@noalhub/ui/button";

import type { AdminSignupRange } from "@noalhub/api/admin";

/**
 * A segmented control for the chart's time range.
 *
 * Built from `Button` rather than a new primitive: three mutually exclusive
 * choices that apply immediately, and `aria-pressed` carries the state for
 * screen readers. A `<Select>` would hide the options behind a click for a
 * choice people flip back and forth while comparing.
 */
export function RangeTabs({
  value,
  onChange,
  options,
  label,
}: {
  value: AdminSignupRange;
  onChange: (next: AdminSignupRange) => void;
  options: { value: AdminSignupRange; label: string }[];
  /** Names the group for assistive tech, e.g. "Time range". */
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="border-border bg-background inline-flex gap-0.5 rounded-lg border p-0.5">
      {options.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={option.value === value ? "primary" : "ghost"}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
