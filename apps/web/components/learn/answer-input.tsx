"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import type { QaAnswerResult, QaItemPlay, QaResponse } from "@noalhub/api/qa";
import { Button } from "@noalhub/ui/button";
import { Icon, LUCIDE } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";
import { Typography } from "@noalhub/ui/typography";

import { playSelect } from "@noalhub/core/sounds";

/** Milliseconds since `start` — module scope, so it is never mistaken for render-time work. */
function elapsedSince(start: number) {
  return Math.max(0, Date.now() - start);
}

/** An option at most this long counts as short — see `compact` in `AnswerInput`. */
const SHORT_OPTION_CHARS = 40;

/**
 * The three ways to answer, picked by the item's shape (`item.templateKey`) — not
 * by whether the item happens to have options.
 *
 * That distinction is the whole reason `templateKey` exists on the DTO (per item,
 * since a dataset mixes shapes): a
 * flashcard has no options either, and inferring from their absence would give
 * it a text box instead of "I knew it / I didn't".
 *
 * There is no confirm button. One click makes an option active; a double click
 * (or Enter) sends it. For a multi-answer question the double click sends every
 * active option, the one under the pointer included.
 *
 * It stays mounted after the answer comes back (`result`), locked, so the
 * learner sees their own pick next to the verdict. Mount it with `key={item.id}`:
 * the picks are local state and must not leak into the next question.
 */
export function AnswerInput({
  item,
  result,
  disabled,
  onSubmit,
}: {
  item: QaItemPlay;
  result: QaAnswerResult | null;
  disabled?: boolean;
  onSubmit: (response: QaResponse, durationMs: number) => void;
}) {
  const t = useTranslations("web.learn");
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");
  const shownAt = useRef(0);

  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const { templateKey } = item;
  const locked = result !== null || disabled === true;
  const options = templateKey !== "flashcard" ? (item.options ?? []) : [];
  // Short answers sit in a 2-wide grid; one long answer sends the whole set back
  // to full-width rows so the text never gets squeezed into half a card. An odd count
  // (3, 5…) would leave a lone card in the last row, so it stays a list too.
  const compact =
    options.length % 2 === 0 &&
    options.every((option) => option.text.length <= SHORT_OPTION_CHARS);
  const single =
    templateKey === "true_false" || templateKey === "single_choice";

  const send = (response: QaResponse) =>
    onSubmit(response, elapsedSince(shownAt.current));

  const toggle = (id: string) => {
    playSelect(single || !picked.includes(id));
    setPicked((prev) =>
      single
        ? [id]
        : prev.includes(id)
          ? prev.filter((value) => value !== id)
          : [...prev, id],
    );
  };

  // Double click: the option joins the picks (if the first click of the pair
  // just un-picked it) and the whole set goes out.
  const submitWith = (id: string) => {
    const next =
      single || picked.includes(id)
        ? single
          ? [id]
          : picked
        : [...picked, id];
    setPicked(next);
    send({ optionIds: next });
  };

  // 1–8 activates an option, Enter answers. Skipped while typing in a field or when
  // a button has focus — there Enter already means "press this".
  useEffect(() => {
    if (options.length === 0 || locked) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, button, [contenteditable]")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < options.length) {
        event.preventDefault();
        toggle(options[index].id);
      } else if (event.key === "Enter" && picked.length > 0) {
        event.preventDefault();
        send({ optionIds: picked });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (templateKey === "flashcard") {
    if (result) return null;
    return (
      <div className="space-y-3">
        {/* The back of the card only arrives with the answer, so this is
            recall-then-judge, not flip-then-judge — and the copy says so. */}
        <Typography variant="body-3" className="text-muted-foreground">
          {t("answer.selfPrompt")}
        </Typography>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button disabled={locked} onClick={() => send({ known: true })}>
            <Icon icon={LUCIDE.circleCheck} />
            {t("answer.known")}
          </Button>
          <Button
            variant="outline"
            disabled={locked}
            onClick={() => send({ known: false })}
          >
            <Icon icon={LUCIDE.circleX} />
            {t("answer.unknown")}
          </Button>
        </div>
        <Typography variant="body-4" className="text-muted-foreground">
          {t("answer.selfNote")}
        </Typography>
      </div>
    );
  }

  if (options.length > 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        {/* Single choice needs no hint — one pick is the default. Several does. */}
        {single ? null : (
          <Typography
            variant="body-4"
            className="shrink-0 text-muted-foreground"
          >
            {t("answer.multiHint")}
          </Typography>
        )}
        {/* The answers get the height the question leaves over and split it evenly, so they
            fill the screen instead of huddling at the top. When they would not fit (a phone,
            four long options) the cards keep a readable height and only THIS box scrolls —
            the question stays in view. The padding keeps focus rings and shadows from being
            clipped by the scroll box. */}
        <div className="-m-1 min-h-0 flex-1 overflow-y-auto p-1">
          <div
            role={single ? "radiogroup" : "group"}
            aria-label={single ? t("answer.singleHint") : t("answer.multiHint")}
            className={`grid min-h-full auto-rows-fr gap-2 ${compact ? "grid-cols-2" : ""}`}
          >
            {options.map((option) => (
              <OptionCard
                key={option.id}
                text={option.text}
                role={single ? "radio" : "checkbox"}
                shape={single ? "round" : "square"}
                state={optionState({
                  chosen: picked.includes(option.id),
                  result,
                  pickCount: picked.length,
                })}
                disabled={locked}
                centered={compact}
                // The second click of a double click must not toggle again.
                onClick={(event) => {
                  if (event.detail < 2) toggle(option.id);
                }}
                onDoubleClick={() => submitWith(option.id)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!locked && text.trim() !== "") send({ text });
      }}
    >
      <Input
        label={t("answer.text")}
        value={text}
        hint={t("answer.textHint")}
        disabled={locked}
        autoFocus
        onChange={(event) => setText(event.target.value)}
      />
    </form>
  );
}

type OptionState = "idle" | "picked" | "right" | "wrong" | "chosen" | "dimmed";

/**
 * What one option looks like once the verdict is in.
 *
 * The result carries no answer key, so only the learner's own picks can be
 * coloured: all of them green when the answer is right, and red only when there
 * was a single pick — with several picks and a wrong verdict, which ones were
 * wrong is not something this screen knows, so they stay neutral.
 */
function optionState({
  chosen,
  result,
  pickCount,
}: {
  chosen: boolean;
  result: QaAnswerResult | null;
  pickCount: number;
}): OptionState {
  if (!result) return chosen ? "picked" : "idle";
  if (!chosen) return "dimmed";
  if (result.isCorrect) return "right";
  return pickCount === 1 ? "wrong" : "chosen";
}

const CARD_STATES: Record<OptionState, { card: string; key: string }> = {
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

function OptionCard({
  text,
  role,
  shape,
  state,
  disabled,
  centered,
  onClick,
  onDoubleClick,
}: {
  text: string;
  role: "radio" | "checkbox";
  /** Round chip = pick one; square chip = pick several. */
  shape: "round" | "square";
  state: OptionState;
  disabled: boolean;
  /** Grid cards (short answers) centre their content; full-width rows stay left-aligned. */
  centered: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onDoubleClick: () => void;
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
      onDoubleClick={onDoubleClick}
      className={`flex h-full min-h-14 w-full items-center gap-3 rounded-lg border-2 px-4 py-3 shadow-sm ${centered ? "justify-center text-center" : "text-left"} transition-[color,background-color,border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default ${look.card}`}
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
