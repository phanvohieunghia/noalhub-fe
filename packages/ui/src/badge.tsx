import { keysOf } from "./variants";

/**
 * Hoisted to module scope: this table IS the definition of the tones, and it
 * used to be rebuilt on every render inside the component while the union type
 * listed the same five names a second time — two lists that nothing kept in
 * step.
 */
const TONES = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/12 text-danger",
  info: "bg-highlight text-highlight-foreground",
} as const;

/**
 * Size carries the text size too, for the same reason as in `Button`: a
 * `text-*` in the base and another in the size have equal specificity, so the
 * stylesheet order would pick the winner instead of the class string.
 */
const SIZES = {
  lg: "px-3 py-1 text-body-3",
  md: "px-2.5 py-[3px] text-body-4",
  sm: "px-2 py-0.5 text-body-4",
} as const;

export type BadgeTone = keyof typeof TONES;
export type BadgeSize = keyof typeof SIZES;

/** Derived from the table above — see `variants.ts`. */
export const BADGE_TONES = keysOf(TONES);
export const BADGE_SIZES = keysOf(SIZES);

/**
 * A small status label. `tone` is **semantic**, not a color — the call site says
 * "warning", never "yellow", so the palette changes in exactly one place later.
 *
 * `warning` is deliberately separate from `danger`: §3b of
 * `docs/admin-plan.md` requires telling a temporary lock (`suspended`) apart
 * from a permanent one (`banned`); one shade of red for both invites the wrong
 * click.
 */
export function Badge({
  tone = "neutral",
  size = "md",
  className = "",
  children,
}: {
  tone?: BadgeTone;
  size?: BadgeSize;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${SIZES[size]} ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
