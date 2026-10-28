"use client";

import { HoverCard } from "radix-ui";
import { useState } from "react";

import { Icon } from "./icons";
import { Typography } from "./typography";

export type MetricItem = {
  key: string;
  icon: string;
  /** Tone class for the icon, e.g. `text-warning`. Defaults to muted. */
  iconClass?: string;
  /** The compact figure shown inline. */
  value: string;
  /** The row label inside the card. */
  label: string;
  /** The row value inside the card; falls back to `value`. */
  detail?: string;
};

/**
 * A compact row of icon + figure chips. Hovering or focusing it opens a card
 * titled `title` with one label/value row per metric (the full breakdown).
 */
export function MetricsCard({
  title,
  items,
  layout = "grid",
  className = "",
}: {
  title: string;
  items: MetricItem[];
  /** `grid` packs the metrics 2 per row; `row` keeps them on a single line. */
  layout?: "grid" | "row";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <HoverCard.Root open={open} onOpenChange={setOpen} openDelay={120} closeDelay={100}>
      <HoverCard.Trigger
        asChild
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <div
          tabIndex={0}
          aria-label={title}
          className={`${layout === "row" ? "flex items-center" : "grid grid-cols-2"} gap-x-2.5 gap-y-0 rounded border border-border px-1.5 py-px text-[0.625rem] leading-3.5 tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
        >
          {items.map((item) => (
            <span key={item.key} className="flex items-center gap-0.5">
              <Icon icon={item.icon} className={`size-2.5 ${item.iconClass ?? "text-muted-foreground"}`} />
              <span className="font-semibold text-foreground">{item.value}</span>
            </span>
          ))}
        </div>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={8}
          className="z-50 min-w-64 rounded-lg border border-border bg-surface p-4 shadow-lg"
        >
          <Typography variant="body-3" weight={600} className="mb-2 text-foreground">
            {title}
          </Typography>
          <dl className="flex flex-col gap-1.5">
            {items.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-6">
                <dt className="text-body-4 text-muted-foreground">{item.label}</dt>
                <dd className="text-body-4 font-semibold tabular-nums text-foreground">
                  {item.detail ?? item.value}
                </dd>
              </div>
            ))}
          </dl>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
