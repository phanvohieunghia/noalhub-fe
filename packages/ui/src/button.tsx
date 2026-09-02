"use client";

import { forwardRef } from "react";
import { Slot } from "radix-ui";

const VARIANTS = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  outline: "border border-border hover:bg-muted",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
} as const;

const SHAPES = {
  default: "rounded-md",
  circle: "rounded-full",
} as const;

const SIZES = {
  md: "h-10 px-4",
  sm: "h-8 px-3",
  /** Square, icon only — always pair it with an `aria-label`. */
  icon: "size-10",
  "icon-sm": "size-7",
} as const;

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  /**
   * Corner rounding. A prop rather than a class passed through `className`: the
   * base's `rounded-md` and an overriding `rounded-full` have the same
   * specificity, so the order in the class string does not decide the winner —
   * the corners come out square at random.
   */
  shape?: keyof typeof SHAPES;
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
    "inline-flex items-center justify-center gap-2 text-body-3 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  const classes = `${base} ${VARIANTS[variant]} ${SIZES[size]} ${SHAPES[shape]} ${className}`;

  // Slot forwards classes/handlers to the child — but `type` is a <button>
  // attribute that means nothing on <a>/<span>, so it is only set when we
  // render the button ourselves.
  if (asChild) return <Slot.Root ref={ref} className={classes} {...props} />;

  return <button ref={ref} type={type} className={classes} {...props} />;
});
