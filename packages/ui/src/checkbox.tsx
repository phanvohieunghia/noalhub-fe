"use client";

import { forwardRef, useId } from "react";
import { Checkbox as RadixCheckbox } from "radix-ui";

import { Icon, ICONS, LUCIDE } from "./icons";
import { Spinner } from "./spinner";
import { Typography } from "./typography";
import type { SpinnerSize } from "./spinner";
import { keysOf } from "./variants";

/**
 * Box size, paired with the icon that sits inside it.
 *
 * `md` matches `Input`'s 40px row, so a checkbox on a form line sits level with
 * the fields around it; `sm` is for dense contexts — a table's select-all column,
 * a filter list.
 */
const SIZES = {
  sm: { box: "size-4 rounded", icon: "size-3", spinner: "xs" },
  md: { box: "size-5 rounded-md", icon: "size-3.5", spinner: "xs" },
} as const satisfies Record<string, { box: string; icon: string; spinner: SpinnerSize }>;

export type CheckboxSize = keyof typeof SIZES;

/** Derived from the table above — see `variants.ts`. */
export const CHECKBOX_SIZES = keysOf(SIZES);

type CheckboxProps = Omit<
  React.ComponentPropsWithoutRef<typeof RadixCheckbox.Root>,
  "children"
> & {
  /** If omitted, pass an `aria-label` yourself — an unlabelled box is an a11y bug. */
  label?: string;
  /** Help text under the label. Hidden while `error` is showing. */
  hint?: string;
  error?: string;
  size?: CheckboxSize;
  /**
   * A toggle whose result is still in flight — an optimistic switch waiting on
   * its request. Implies `disabled`: the box keeps showing the state the server
   * last confirmed instead of a second click racing the first.
   */
  loading?: boolean;
};

/**
 * A checkbox on Radix's primitive rather than a bare `<input type="checkbox">`:
 * the third state (`checked="indeterminate"`) is the reason. A select-all box
 * over a partial selection has to render as a dash AND report
 * `aria-checked="mixed"`, and the native element only does the former, through
 * an imperative `indeterminate` DOM property that React does not manage.
 *
 * The hidden native input Radix renders keeps `name`/`value` working inside a
 * plain `<form>` and with react-hook-form's `Controller`.
 */
export const Checkbox = forwardRef<
  React.ComponentRef<typeof RadixCheckbox.Root>,
  CheckboxProps
>(function Checkbox(
  { label, hint, error, size = "md", loading = false, disabled, id, className = "", ...props },
  ref,
) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;
  const errorId = `${checkboxId}-error`;
  const hintId = `${checkboxId}-hint`;
  const sizeClasses = SIZES[size];
  const isDisabled = disabled || loading;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  /** Box width + gap, so hint and error line up under the label, not the box. */
  const indent = size === "sm" ? "ps-[1.625rem]" : "ps-[1.875rem]";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-2.5">
        {/*
          The box is centered against the FIRST LINE of the label, not against
          the whole block: `text-body-3` + `h-[1.6em]` reproduces that line's box
          (--text-body-3--line-height), so a one-line label reads as centered
          while a wrapping one still starts at the top edge. Doing it with a
          margin instead means a magic number per size that is wrong the moment
          the type scale moves.
        */}
        <span className="flex h-[1.6em] shrink-0 items-center text-body-3">
          <RadixCheckbox.Root
            {...props}
            id={checkboxId}
            ref={ref}
            disabled={isDisabled}
            aria-busy={loading || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`group flex shrink-0 items-center justify-center border outline-none transition-colors
              bg-surface border-border text-muted-foreground
              data-[state=checked]:text-primary-foreground
              data-[state=indeterminate]:text-primary-foreground
              hover:border-muted-foreground
              focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40
              disabled:cursor-not-allowed
              data-[state=checked]:bg-primary data-[state=checked]:border-primary
              data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary
              aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/30
              ${loading ? "cursor-progress" : isDisabled ? "opacity-50" : ""}
              ${sizeClasses.box} ${className}`}
          >
            {/* Outside the Indicator: that one only renders while checked, and a
                pending toggle has to be visible from the unchecked side too. */}
            {loading ? <Spinner size={sizeClasses.spinner} /> : null}
            <RadixCheckbox.Indicator
              className={`items-center justify-center ${loading ? "hidden" : "flex"}`}
            >
              {/*
                Both marks are rendered and the Root's `data-state` picks one, so
                the dash/tick choice follows the real state — including the
                uncontrolled case, where the caller has no `checked` to read.
              */}
              <Icon
                icon={ICONS.check}
                className={`${sizeClasses.icon} group-data-[state=indeterminate]:hidden`}
              />
              <Icon
                icon={LUCIDE.minus}
                className={`${sizeClasses.icon} hidden group-data-[state=indeterminate]:block`}
              />
            </RadixCheckbox.Indicator>
          </RadixCheckbox.Root>
        </span>
        {label ? (
          <Typography
            variant="body-3"
            as="label"
            htmlFor={checkboxId}
            className={`cursor-pointer select-none ${loading ? "cursor-progress" : ""} ${
              disabled ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            {label}
          </Typography>
        ) : null}
      </div>
      {error ? (
        <Typography
          variant="body-3"
          id={errorId}
          role="alert"
          className={`text-danger ${indent}`}
        >
          {error}
        </Typography>
      ) : hint ? (
        <Typography variant="body-3" id={hintId} className={`text-muted-foreground ${indent}`}>
          {hint}
        </Typography>
      ) : null}
    </div>
  );
});
