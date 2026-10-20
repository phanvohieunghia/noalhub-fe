"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import type { QaItemFull } from "@noalhub/api/qa";
import { Badge } from "@noalhub/ui/badge";
import { Typography } from "@noalhub/ui/typography";

import { PostContentPreview } from "./post-content-preview";

/** How long the pointer must rest on a question before its answer slides open. */
export const HOVER_REVEAL_DELAY_MS = 500;

/**
 * One question as the workbench draws it: shape tag, the numbered question, then
 * what a correct answer looks like. A choice question lists every option with a
 * letter and marks the right ones; a flashcard shows its answer and explanation;
 * a short answer lists the accepted answers.
 *
 * It only draws. Whatever sits in the top-right — status, approve, edit — is passed
 * in as `actions`, so the same body serves the review step and the final step.
 * The correct options are found by matching ids against `answerKey`, never by a
 * `correct` flag on an option: there is none, on purpose.
 */
export function QaReviewQuestion({
  item,
  index,
  shapeLabel,
  tags,
  actions,
  revealOnHover = false,
}: {
  item: QaItemFull;
  /** Zero-based position, shown one-based in front of the question. */
  index: number;
  shapeLabel: string;
  /** Extra tags next to the shape, e.g. the section it belongs to. */
  tags?: string[];
  actions?: React.ReactNode;
  /**
   * Keep only the question visible; the options, answer and explanation slide open
   * on hover or keyboard focus. Click pins it open, which is how touch screens get it.
   */
  revealOnHover?: boolean;
}) {
  const t = useTranslations("admin.qa");
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const onPointerEnter = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(
      () => setHovered(true),
      HOVER_REVEAL_DELAY_MS,
    );
  };
  const onPointerLeave = () => {
    clearTimeout(hoverTimer.current);
    setHovered(false);
  };

  const correctIds =
    item.answerKey && "optionIds" in item.answerKey
      ? item.answerKey.optionIds
      : [];
  const accepted =
    item.answerKey && "accepted" in item.answerKey
      ? item.answerKey.accepted
      : [];

  return (
    <article
      onPointerEnter={revealOnHover ? onPointerEnter : undefined}
      onPointerLeave={revealOnHover ? onPointerLeave : undefined}
      className="group flex flex-col rounded-lg border border-border bg-surface p-4"
    >
      <div className="flex flex-wrap items-center gap-2 pb-2.5">
        <Typography
          variant="title-3"
          as="span"
          weight={600}
          aria-hidden="true"
          className="shrink-0"
        >
          {index + 1}.
        </Typography>
        <Badge size="sm">{shapeLabel}</Badge>
        <Badge size="sm">{t(`items.kinds.${item.kind}`)}</Badge>
        {item.difficulty ? (
          <Badge size="sm">{t(`items.difficulty.${item.difficulty}`)}</Badge>
        ) : null}
        {tags?.map((tag) => (
          <Badge key={tag} size="sm">
            {tag}
          </Badge>
        ))}
        <div className="flex-1" />
        {actions}
      </div>

      <div
        className={`flex ${revealOnHover ? "cursor-pointer" : ""}`}
        onClick={revealOnHover ? () => setPinned((value) => !value) : undefined}
      >
        <div className="min-w-0 flex-1">
          <PostContentPreview doc={item.question} tagIds={item.tagIds} />
        </div>
      </div>

      <div
        className={
          revealOnHover
            ? `grid transition-[grid-template-rows] duration-200 ease-out group-focus-within:grid-rows-[1fr] ${
                pinned || hovered ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`
            : undefined
        }
      >
        <div
          className={`flex flex-col gap-2.5 ${revealOnHover ? "min-h-0 overflow-hidden pt-2.5" : "pt-2.5"}`}
        >
          {item.options?.map((option, optionIndex) => {
            const isCorrect = correctIds.includes(option.id);
            return (
              <div
                key={option.id}
                className={`flex items-center gap-2.5 rounded-md border px-2.5 py-2 text-body-3 bg-muted ${
                  isCorrect ? "border-success" : "border-transparent"
                }`}
              >
                <Typography variant="body-3" as="span" weight={600}>
                  {String.fromCharCode(65 + optionIndex)}
                </Typography>
                <Typography variant="body-3" as="span" className="min-w-0 flex-1">
                  {option.text}
                </Typography>
                {isCorrect ? (
                  <Typography variant="body-4" as="span" className="shrink-0 text-success">
                    {t("ws.sets.correct")}
                  </Typography>
                ) : null}
              </div>
            );
          })}

          {item.options === null && item.answer ? (
            <Block label={t("ws.sets.answer")} tone="correct">
              <PostContentPreview doc={item.answer} />
            </Block>
          ) : null}

          {accepted.map((answer, answerIndex) => (
            <Block
              key={answer}
              label={answerIndex === 0 ? t("ws.sets.answer") : undefined}
              tone={answerIndex === 0 ? "correct" : "plain"}
            >
              {answer}
            </Block>
          ))}

          {item.explanation ? (
            <Block label={t("ws.sets.explanation")}>
              <PostContentPreview doc={item.explanation} />
            </Block>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Block({
  label,
  tone = "plain",
  children,
}: {
  label?: string;
  tone?: "plain" | "correct";
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <Typography
          variant="caption"
          className="uppercase text-muted-foreground"
        >
          {label}
        </Typography>
      ) : null}
      <div
        className={`rounded-md border bg-muted px-2.5 py-2 text-body-3 ${
          tone === "correct" ? "border-success" : "border-transparent"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
