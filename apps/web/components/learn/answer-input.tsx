"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import type {
  QaAnswerResult,
  QaItemPlay,
  QaResponse,
  QaTemplateKey,
} from "@noalhub/api/qa";
import { Button } from "@noalhub/ui/button";
import { Icon, LUCIDE } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";

const LETTERS = "ABCDEFGH";

/**
 * The three ways to answer, picked by the SET's shape — not by whether the item
 * happens to have options.
 *
 * That distinction is the whole reason `templateKey` exists on the DTO: a
 * flashcard has no options either, and inferring from their absence would give
 * it a text box instead of "I knew it / I didn't".
 *
 * It stays mounted after the answer comes back (`result`), locked, so the
 * learner sees their own pick next to the verdict. Mount it with `key={item.id}`:
 * the picks are local state and must not leak into the next question.
 */
export function AnswerInput({
  templateKey,
  item,
  result,
  disabled,
  onSubmit,
}: {
  templateKey: QaTemplateKey;
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

  const locked = result !== null || disabled === true;
  const options = templateKey !== "flashcard" ? (item.options ?? []) : [];
  const single = templateKey === "true_false";

  const send = (response: QaResponse) =>
    onSubmit(response, Math.max(0, Date.now() - shownAt.current));

  const toggle = (id: string) =>
    setPicked((current) => {
      if (single) return [id];
      return current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id];
    });

  // 1–8 picks an option, Enter answers. Skipped while typing in a field or when
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
        <p className="text-body-3 text-muted-foreground">{t("answer.selfPrompt")}</p>
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
        <p className="text-body-4 text-muted-foreground">{t("answer.selfNote")}</p>
      </div>
    );
  }

  if (options.length > 0) {
    return (
      <div className="space-y-3">
        <p className="text-body-4 text-muted-foreground">
          {single ? t("answer.singleHint") : t("answer.multiHint")}
        </p>
        <div
          role={single ? "radiogroup" : "group"}
          aria-label={single ? t("answer.singleHint") : t("answer.multiHint")}
          className="space-y-2"
        >
          {options.map((option, index) => (
            <OptionCard
              key={option.id}
              letter={LETTERS[index] ?? String(index + 1)}
              text={option.text}
              role={single ? "radio" : "checkbox"}
              state={optionState({
                chosen: picked.includes(option.id),
                result,
                pickCount: picked.length,
              })}
              disabled={locked}
              onClick={() => toggle(option.id)}
            />
          ))}
        </div>
        {result ? null : (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="hidden text-body-4 text-muted-foreground sm:block">
              <Icon icon={LUCIDE.keyboard} className="mr-1 inline size-4 align-text-bottom" />
              {t("answer.shortcuts", { max: options.length })}
            </p>
            <Button
              disabled={locked || picked.length === 0}
              onClick={() => send({ optionIds: picked })}
            >
              {t("answer.submit")}
            </Button>
          </div>
        )}
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
      {result ? null : (
        <div className="flex justify-end">
          <Button type="submit" disabled={locked || text.trim() === ""}>
            {t("answer.submit")}
          </Button>
        </div>
      )}
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

const CARD_STATES: Record<OptionState, { card: string; letter: string }> = {
  idle: {
    card: "border-border hover:border-primary/50 hover:bg-muted",
    letter: "border-border text-muted-foreground",
  },
  picked: {
    card: "border-primary bg-primary/8",
    letter: "border-primary bg-primary text-primary-foreground",
  },
  right: {
    card: "border-success bg-success/12",
    letter: "border-success bg-success text-background",
  },
  wrong: {
    card: "border-danger bg-danger/12",
    letter: "border-danger bg-danger text-background",
  },
  chosen: {
    card: "border-foreground/40 bg-muted",
    letter: "border-foreground/40 text-foreground",
  },
  dimmed: {
    card: "border-border opacity-60",
    letter: "border-border text-muted-foreground",
  },
};

function OptionCard({
  letter,
  text,
  role,
  state,
  disabled,
  onClick,
}: {
  letter: string;
  text: string;
  role: "radio" | "checkbox";
  state: OptionState;
  disabled: boolean;
  onClick: () => void;
}) {
  const look = CARD_STATES[state];
  const checked = state !== "idle" && state !== "dimmed";

  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default ${look.card}`}
    >
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-md border text-body-4 font-semibold transition-colors ${look.letter}`}
      >
        {letter}
      </span>
      <span className="flex-1 pt-0.5 text-body-2">{text}</span>
      {state === "right" ? (
        <Icon icon={LUCIDE.check} className="mt-1 size-5 text-success" />
      ) : state === "wrong" ? (
        <Icon icon={LUCIDE.x} className="mt-1 size-5 text-danger" />
      ) : null}
    </button>
  );
}
