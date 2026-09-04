"use client";

import { forwardRef } from "react";
import { Slot } from "radix-ui";

import { keysOf } from "./variants";

const VARIANTS = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  outline: "border border-border hover:bg-muted",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
  /** A filled but quiet button — used for chips and other in-content controls. */
  soft: "bg-muted text-foreground hover:bg-muted/60",
  /** "Add something that does not exist yet": the dashed border is the affordance. */
  dashed: "border border-dashed border-border text-muted-foreground hover:bg-muted hover:text-foreground",
  /**
   * Reads as a link, behaves as a button. For in-form shortcuts ("fill the slug
   * from the title") that navigate nowhere — a real `<a>` there would lie to
   * the screen reader and to middle-click. Pair it with `size="inline"`; a box
   * size would put a 40px-tall link in the middle of a paragraph.
   */
  link: "text-muted-foreground underline underline-offset-2 hover:text-foreground",
} as const;

const SHAPES = {
  default: "rounded-md",
  circle: "rounded-full",
} as const;

/**
 * Size carries the text size too. It cannot live in the base: `text-body-3`
 * there and `text-body-4` here have equal specificity, so which one wins is
 * decided by the stylesheet order, not by the order in the class string.
 */
const SIZES = {
  md: "h-10 px-4 text-body-3",
  sm: "h-8 px-3 text-body-3",
  xs: "h-7 px-2.5 text-body-4",
  /** Square, icon only — always pair it with an `aria-label`. */
  icon: "size-10",
  "icon-sm": "size-7",
  /** No box at all: for `variant="link"` sitting inside a line of text. */
  inline: "h-auto p-0 text-body-4",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;
export type ButtonShape = keyof typeof SHAPES;

/** The lists, derived from the tables above — see `variants.ts`. */
export const BUTTON_VARIANTS = keysOf(VARIANTS);
export const BUTTON_SIZES = keysOf(SIZES);
export const BUTTON_SHAPES = keysOf(SHAPES);

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Corner rounding. A prop rather than a class passed through `className`: the
   * base's `rounded-md` and an overriding `rounded-full` have the same
   * specificity, so the order in the class string does not decide the winner —
   * the corners come out square at random.
   */
  shape?: ButtonShape;
  /**
   * Render onto the child element instead of emitting a `<button>`. Needed when
   * Button acts as a Radix `Trigger` / `Close` — both sides want to be that
   * button, and nesting a button inside a button is invalid HTML.
   */
  asChild?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    shape = "default",
    className = "",
    asChild,
    type = "button",
    ...props
  },
  ref,
) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  const classes = `${base} ${VARIANTS[variant]} ${SIZES[size]} ${SHAPES[shape]} ${className}`;

  // Slot forwards classes/handlers to the child — but `type` is a <button>
  // attribute that means nothing on <a>/<span>, so it is only set when we
  // render the button ourselves.
  if (asChild) return <Slot.Root ref={ref} className={classes} {...props} />;

  return <button ref={ref} type={type} className={classes} {...props} />;
});
