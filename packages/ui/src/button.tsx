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
  /** Vuông, chỉ chứa icon — dùng kèm `aria-label`. */
  icon: "size-10",
  "icon-sm": "size-7",
} as const;

type ButtonProps = React.ComponentPropsWithoutRef<"button"> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  /**
   * Bo góc. Là prop chứ không phải class truyền vào `className`: `rounded-md`
   * của base và `rounded-full` ghi đè có cùng specificity, nên thứ tự trong
   * chuỗi class không quyết định được cái nào thắng — góc sẽ vuông ngẫu nhiên.
   */
  shape?: keyof typeof SHAPES;
  /**
   * Render prop lên phần tử con thay vì tự dựng `<button>`. Cần khi Button
   * đứng làm `Trigger` / `Close` của Radix — hai bên đều muốn là cái nút đó,
   * lồng button trong button thì HTML sai.
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

  // Slot chuyển class/handler xuống con — nhưng `type` là thuộc tính của
  // <button>, không áp cho <a>/<span>, nên chỉ đặt khi tự render button.
  if (asChild) return <Slot.Root ref={ref} className={classes} {...props} />;

  return <button ref={ref} type={type} className={classes} {...props} />;
});
