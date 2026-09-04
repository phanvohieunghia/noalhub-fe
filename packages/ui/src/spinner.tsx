import { keysOf } from "./variants";

/**
 * One row per size. Every shape a variant may need is listed here, so adding a
 * size never means hunting for hardcoded numbers inside the variants.
 */
const SIZES = {
  xs: { box: "size-3", ring: "border-2", dot: "size-1", bar: "w-0.5" },
  sm: { box: "size-4", ring: "border-2", dot: "size-1.5", bar: "w-0.5" },
  md: { box: "size-5", ring: "border-2", dot: "size-1.5", bar: "w-1" },
  lg: { box: "size-8", ring: "border-[3px]", dot: "size-2", bar: "w-1" },
  xl: { box: "size-12", ring: "border-4", dot: "size-3", bar: "w-1.5" },
} as const;

/** The visual shapes. All of them inherit `currentColor` from the parent. */
const VARIANTS = ["ring", "dots", "bars", "pulse"] as const;

export type SpinnerSize = keyof typeof SIZES;
export type SpinnerVariant = (typeof VARIANTS)[number];

/** Derived from the tables above — see `variants.ts`. */
export const SPINNER_SIZES = keysOf(SIZES);
export const SPINNER_VARIANTS = VARIANTS;

/** How many marks `dots` and `bars` are made of, and their stagger. */
const MARKS = [0, 1, 2];
const STAGGER_MS = 140;

/**
 * A loading spinner. `aria-hidden` by default — the loading state must be
 * announced by the container (`role="status"` plus text), not by the animation.
 *
 * Unlike the modals, the animation is NOT wrapped in `motion-safe:`: a spinner
 * that stands still is not a quieter spinner, it is a frozen UI. Under
 * `prefers-reduced-motion` it keeps turning, just slower — see the
 * `@media (prefers-reduced-motion: reduce)` block in `packages/config/theme.css`.
 *
 * `variant` picks the shape: `ring` for a button or an inline action, `dots` for
 * "something is coming" inside text, `bars` for a busy panel, `pulse` for the
 * quietest of the four (a background refresh that must not pull the eye).
 */
export function Spinner({
  size = "sm",
  variant = "ring",
  className = "",
}: {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
}) {
  const shape = SIZES[size];

  if (variant === "dots") {
    return (
      <span
        aria-hidden
        className={`inline-flex items-center gap-1 opacity-60 ${className}`}
      >
        {MARKS.map((mark) => (
          <span
            key={mark}
            className={`inline-block rounded-full bg-current animate-bounce ${shape.dot}`}
            style={{ animationDelay: `${mark * STAGGER_MS}ms` }}
          />
        ))}
      </span>
    );
  }

  if (variant === "bars") {
    return (
      <span
        aria-hidden
        className={`inline-flex items-end gap-0.5 opacity-60 ${shape.box} ${className}`}
      >
        {MARKS.map((mark) => (
          <span
            key={mark}
            className={`h-full origin-bottom rounded-full bg-current animate-bar ${shape.bar}`}
            style={{ animationDelay: `${mark * STAGGER_MS}ms` }}
          />
        ))}
      </span>
    );
  }

  if (variant === "pulse") {
    return (
      <span
        aria-hidden
        // No `opacity-60` here: Tailwind's `pulse` only declares the 50% frame
        // (`opacity: .5`), so the start/end value is whatever the element's own
        // opacity is. Pinning it to .6 makes the animation swing .6 → .5 → .6,
        // a tenth of a step — invisible. Left alone it swings 1 → .5 → 1.
        className={`inline-block rounded-full bg-current animate-pulse ${shape.box} ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`inline-block rounded-full border-current border-t-transparent opacity-60 animate-spin ${shape.box} ${shape.ring} ${className}`}
    />
  );
}
