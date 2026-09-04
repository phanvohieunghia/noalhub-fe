"use client";

import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";

import { Typography } from "./typography";
import { keysOf } from "./variants";

/**
 * How the box is allowed to change height.
 *
 * `auto` is the one worth knowing about: the field grows with what is typed (up
 * to `maxRows`), so a long excerpt is never written through a three-line
 * peephole — and it stops growing rather than pushing the Save button off
 * screen.
 */
const RESIZE = {
  none: "resize-none",
  vertical: "resize-y",
  auto: "resize-none overflow-hidden",
} as const;

export type TextareaResize = keyof typeof RESIZE;

/** Derived from the table above — see `variants.ts`. */
export const TEXTAREA_RESIZE = keysOf(RESIZE);

type TextareaProps = React.ComponentPropsWithoutRef<"textarea"> & {
  /** If omitted, pass an `aria-label` yourself — an unlabelled field is an a11y bug. */
  label?: string;
  error?: string;
  /** Help text under the field. Hidden while `error` is showing. */
  hint?: string;
  /** Default `vertical`; `auto` grows with the content up to `maxRows`. */
  resize?: TextareaResize;
  /** Ceiling for `resize="auto"`. Past it the field scrolls instead. */
  maxRows?: number;
  /** Shows `12/200` under the field. Needs `maxLength` to show the ceiling. */
  showCount?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    error,
    hint,
    resize = "vertical",
    maxRows = 12,
    showCount = false,
    id,
    className = "",
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;
  const hintId = `${textareaId}-hint`;

  // The auto-grow needs the element itself, and the caller may want it too
  // (focus, select) — so the local ref is the real one and the forwarded ref is
  // pointed at it.
  const innerRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, []);

  const fit = useCallback(() => {
    const element = innerRef.current;
    if (!element || resize !== "auto") return;
    // Reset first: the scroll height of a box that is already tall never
    // shrinks, so without this the field can only ever grow.
    element.style.height = "auto";
    const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 20;
    const max = lineHeight * maxRows;
    element.style.height = `${Math.min(element.scrollHeight, max)}px`;
    element.style.overflowY = element.scrollHeight > max ? "auto" : "hidden";
  }, [resize, maxRows]);

  // Runs on every render so a controlled value set from outside (a reset, a
  // draft loaded from the server) resizes the box too, not just typing.
  useLayoutEffect(fit);

  const value = props.value ?? props.defaultValue;
  const length = typeof value === "string" ? value.length : 0;

  const describedBy =
    [error ? errorId : null, hint && !error ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <Typography variant="title-4" as="label" htmlFor={textareaId}>
          {label}
        </Typography>
      ) : null}
      <textarea
        {...props}
        id={textareaId}
        ref={innerRef}
        rows={props.rows ?? 3}
        onInput={(event) => {
          fit();
          props.onInput?.(event);
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`rounded-md border border-border bg-transparent px-3 py-2 text-body-3 outline-none transition-colors
            focus:border-foreground/60
            disabled:opacity-50
            aria-[invalid=true]:border-danger
            ${RESIZE[resize]}
            ${className}`}
      />

      {/* One row for both, so adding a counter never pushes the error out of
          line — and never leaves an empty gap when there is neither. */}
      {error || (hint && !error) || showCount ? (
        <div className="flex items-start justify-between gap-3">
          {error ? (
            <Typography variant="body-3" id={errorId} role="alert" className="text-danger">
              {error}
            </Typography>
          ) : hint ? (
            <Typography variant="body-4" id={hintId} className="text-muted-foreground">
              {hint}
            </Typography>
          ) : (
            <span />
          )}

          {showCount ? (
            <Typography
              variant="body-4"
              aria-hidden
              className={`shrink-0 tabular-nums ${
                props.maxLength && length > props.maxLength
                  ? "text-danger"
                  : "text-muted-foreground"
              }`}
            >
              {props.maxLength ? `${length}/${props.maxLength}` : length}
            </Typography>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
