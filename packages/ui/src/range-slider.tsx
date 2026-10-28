"use client";

import { useMemo, useState } from "react";
import { Slider } from "radix-ui";

import { Tooltip } from "./tooltip";

/** From the previous segment's end (or `min`) up to and including `to`, every `step`. */
export type RangeSegment = { to: number; step: number };

export type RangeTick = {
  value: number;
  /** Shown under a taller mark; omit for a short, unlabelled mark. */
  label?: string;
};

export type RangeSliderProps = {
  /** `[low, high]`. Snapped to the nearest reachable value. */
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  min?: number;
  /**
   * Coarser steps as the number grows: `[{to: 100, step: 1}, {to: 500, step: 10}]`
   * walks 0…100 by 1, then 100…500 by 10. Each step takes the same width on the
   * track, so the fine segment gets the room it needs.
   */
  segments: RangeSegment[];
  ticks?: RangeTick[];
  /** Names the two thumbs: read aloud, and shown with the value on hover. */
  thumbLabels: [string, string];
  disabled?: boolean;
  className?: string;
};

const THUMB = 20;

/**
 * A two-thumb range: pick a low and a high bound on one track. Built on Radix's
 * Slider, so keyboard (arrows, Home/End), `role="slider"` and touch come with it.
 * The band between the thumbs is the selection; it shows the slice of a green → red gradient that sits under it.
 *
 * Radix only knows one linear step, so the slider runs over the *index* of the
 * reachable values and the value is read back from that list.
 */
export function RangeSlider({
  value,
  onValueChange,
  min = 0,
  segments,
  ticks = [],
  thumbLabels,
  disabled,
  className = "",
}: RangeSliderProps) {
  const values = useMemo(() => {
    const list = [min];
    let at = min;
    for (const { to, step } of segments) {
      while (at + step <= to) {
        at += step;
        list.push(at);
      }
    }
    return list;
  }, [min, segments]);
  const last = values.length - 1;

  // The tooltip follows hover and focus on its own; while a thumb is held it
  // must stay up too, or the value is hidden by the very finger moving it.
  const [hovered, setHovered] = useState<number | null>(null);
  const [held, setHeld] = useState<number | null>(null);
  const [pressing, setPressing] = useState(false);

  const indexOf = (target: number) => {
    let best = 0;
    for (let i = 1; i <= last; i += 1) {
      if (Math.abs(values[i] - target) < Math.abs(values[best] - target)) {
        best = i;
      }
    }
    return best;
  };
  const indices = [indexOf(value[0]), indexOf(value[1])];

  // Green at the track's start to red at its end, painted over the whole track
  // and revealed only between the thumbs — so a colour means a position, not
  // "whatever is selected".
  const width = (indices[1] - indices[0]) / last;
  const rangeStyle: React.CSSProperties = {
    backgroundImage:
      "linear-gradient(to right, var(--color-success), var(--color-warning), var(--color-danger))",
    backgroundSize: `${width > 0 ? 100 / width : 100}% 100%`,
    backgroundPosition: `${width < 1 ? (indices[0] / last / (1 - width)) * 100 : 0}% 0`,
  };

  // The thumb's centre travels `THUMB / 2` in from each end, so marks follow it.
  const place = (target: number) =>
    `calc(${THUMB / 2}px + ${indexOf(target) / last} * (100% - ${THUMB}px))`;

  return (
    <div
      className={`flex flex-col text-body-3 tabular-nums text-muted-foreground ${className}`}
    >
      <div className="min-w-0">
        <Slider.Root
          value={indices}
          min={0}
          max={last}
          step={1}
          minStepsBetweenThumbs={0}
          disabled={disabled}
          onPointerDown={() => setPressing(true)}
          onValueCommit={() => {
            setPressing(false);
            setHeld(null);
          }}
          onValueChange={(next) => {
            // Pressing the track moves the nearest thumb: whichever changed is held.
            if (pressing) setHeld(next[0] !== indices[0] ? 0 : 1);
            onValueChange([values[next[0]], values[next[1]]]);
          }}
          className="relative flex h-7 touch-none select-none items-center data-[disabled]:opacity-50"
        >
          <Slider.Track
            style={{ marginInline: THUMB / 2 }}
            className="relative h-2.5 grow rounded-full bg-muted"
          >
            <Slider.Range
              className="absolute h-full rounded-full"
              style={rangeStyle}
            />
          </Slider.Track>
          {thumbLabels.map((label, i) => (
            <Tooltip
              key={label}
              label={`${label}: ${value[i]}`}
              open={hovered === i || held === i}
              onOpenChange={(next) => setHovered(next ? i : null)}
            >
              <Slider.Thumb
                aria-label={label}
                className="block size-5 rounded-full border border-border bg-surface shadow-md outline-none transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring"
              />
            </Tooltip>
          ))}
        </Slider.Root>
        {ticks.length > 0 ? (
          <div className="relative h-8" aria-hidden="true">
            {ticks.map((tick) => (
              <span
                key={tick.value}
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                style={{ left: place(tick.value) }}
              >
                <span
                  className={`w-px ${tick.label ? "h-2 bg-muted-foreground" : "h-1 bg-border"}`}
                />
                {tick.label ? (
                  <span className="mt-0.5 text-body-4">{tick.label}</span>
                ) : null}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
