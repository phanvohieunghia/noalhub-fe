"use client";

import { useTranslations } from "next-intl";

import type { QaItemFull } from "@noalhub/api/qa";
import { Badge } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { Icon, ICONS } from "@noalhub/ui/icons";

import { PostContentPreview } from "./post-content-preview";
import { Typography } from "@noalhub/ui/typography";

/**
 * One question of a set, read-only: kind and difficulty on top, the numbered
 * question, then every option as a row with its letter. The correct one is the
 * row with a success border and a "Correct answer" tag.
 *
 * The card only draws. What the buttons do — move, remove, edit — is decided by
 * the page, which passes the handlers in; a button without a handler is not
 * drawn, so the same card can be shown locked once the set has left draft.
 *
 * The correct answers are found by matching ids against `answerKey`, never by
 * looking for a `correct` flag — `options` does not carry one, on purpose: one
 * truth, one place to write it.
 */
export function QaQuestionCard({
  item,
  index,
  isLast = false,
  onMoveUp,
  onMoveDown,
  onRemove,
  onEdit,
  removing = false,
}: {
  item: QaItemFull;
  /** Zero-based position in the set; shown one-based in front of the question. */
  index: number;
  /** The last question cannot move down. */
  isLast?: boolean;
  /** Each button is drawn only when its handler is given; omit them all to lock the card. */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
  onEdit?: () => void;
  removing?: boolean;
}) {
  const t = useTranslations("admin.qa");

  const correctIds =
    item.answerKey && "optionIds" in item.answerKey ? item.answerKey.optionIds : [];
  const accepted =
    item.answerKey && "accepted" in item.answerKey ? item.answerKey.accepted : [];

  return (
    <article className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <Badge size="sm">{t(`items.kinds.${item.kind}`)}</Badge>
        {item.difficulty ? (
          <Badge size="sm">{t(`items.difficulty.${item.difficulty}`)}</Badge>
        ) : null}
        <div className="flex-1" />
        {onMoveUp ? (
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("sets.moveUp")}
            disabled={index === 0}
            onClick={onMoveUp}
          >
            ↑
          </Button>
        ) : null}
        {onMoveDown ? (
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("sets.moveDown")}
            disabled={isLast}
            onClick={onMoveDown}
          >
            ↓
          </Button>
        ) : null}
        {onRemove ? (
          <Button variant="ghost" size="sm" disabled={removing} onClick={onRemove}>
            {t("sets.removeItem")}
          </Button>
        ) : null}
        {onEdit ? (
          <Button
            variant="outline"
            size="icon-md"
            aria-label={t("sets.editItem")}
            onClick={onEdit}
          >
            <Icon icon={ICONS.edit} />
          </Button>
        ) : null}
      </div>

      <div className="flex gap-1">
        <Typography variant="title-3" as="span" weight={600} aria-hidden="true">
          {index + 1}.
        </Typography>
        <div className="min-w-0 flex-1">
          <PostContentPreview doc={item.question} />
        </div>
      </div>

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
                {t("sets.correctAnswer")}
              </Typography>
            ) : null}
          </div>
        );
      })}

      {accepted.length > 0 ? (
        <Typography variant="body-3" className="text-muted-foreground">
          {t("sets.accepted", { answers: accepted.join(" · ") })}
        </Typography>
      ) : null}

      {item.explanation ? (
        <div className="mt-1 flex flex-col gap-1 border-t border-border pt-3">
          <Typography variant="body-4" as="span" className="text-muted-foreground">
            {t("sets.explanation")}
          </Typography>
          <PostContentPreview doc={item.explanation} />
        </div>
      ) : null}
    </article>
  );
}
