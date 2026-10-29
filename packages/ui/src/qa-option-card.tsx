"use client";

import { Icon, LUCIDE } from "./icons";
import { Typography } from "./typography";

export type QaOptionState = "idle" | "picked" | "right" | "wrong" | "chosen" | "dimmed";

const CARD_STATES: Record<QaOptionState, { card: string; key: string }> = {
  idle: {
    card: "border-foreground/20 bg-surface hover:border-primary/60 hover:shadow-md",
    key: "border-border text-muted-foreground",
  },
  picked: {
    card: "border-primary bg-primary/8",
    key: "border-primary bg-primary text-primary-foreground",
  },
  right: {
    card: "border-success bg-success/12",
    key: "border-success bg-success text-background",
  },
  wrong: {
    card: "border-danger bg-danger/12",
    key: "border-danger bg-danger text-background",
  },
  chosen: {
    card: "border-foreground/40 bg-muted",
    key: "border-foreground/40 text-foreground",
  },
  dimmed: {
    card: "border-border opacity-60",
    key: "border-border text-muted-foreground",
  },
};

/**
 * One answer card of a choice question — shared by the learner's screen (web) and
 * the admin's preview, so the two cannot drift apart.
 */
export function QaOptionCard({
  text,
  role,
  shape,
  state,
  disabled,
  centered,
  onClick,
}: {
  text: string;
  role: "radio" | "checkbox";
  /** Round chip = pick one; square chip = pick several. */
  shape: "round" | "square";
  state: QaOptionState;
  disabled: boolean;
  /** Grid cards (short answers) centre their content; full-width rows stay left-aligned. */
  centered: boolean;
  onClick: () => void;
}) {
  const look = CARD_STATES[state];
  const checked = state !== "idle" && state !== "dimmed";
  // No number on the card: the 1–8 keys still work, but the screen reads as
  // plain answers. A multi-answer card keeps a box so "pick several" is clear.
  const ticked = shape === "square" && state === "picked";

  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-full min-h-11 w-full items-center gap-3 rounded-lg border-2 px-3 py-2 shadow-sm ${centered ? "justify-center text-center" : "text-left"} transition-[color,background-color,border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default ${look.card}`}
    >
      {shape === "square" ? (
        <span
          aria-hidden
          className={`flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors ${look.key}`}
        >
          {ticked ? <Icon icon={LUCIDE.check} className="size-4" /> : null}
        </span>
      ) : null}
      <Typography
        as="span"
        variant="body-2"
        className={centered ? "" : "flex-1"}
      >
        {text}
      </Typography>
    </button>
  );
}
