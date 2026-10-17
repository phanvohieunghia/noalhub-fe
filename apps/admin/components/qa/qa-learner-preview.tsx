"use client";

import { useTranslations } from "next-intl";

import { useQaItemSearch, useQaSet, type QaItemSearchRow } from "@noalhub/api/qa";
import { Badge } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { Icon, LUCIDE } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Typography } from "@noalhub/ui/typography";

import { PostContentPreview } from "./post-content-preview";

type ShapeKey = "multiple_choice";

/**
 * A modal showing one question exactly as a learner sees it, per shape: choice
 * rows, a text field, or the flashcard self-grade buttons. Read-only: publishing
 * is decided per question type on the list, not here.
 *
 * The header (shape and set title) is the learner's own frame, drawn on purpose.
 * There is no progress bar or "N correct" badge: nobody is answering here.
 */
export function QaLearnerPreview({
  item,
  onClose,
}: {
  item: QaItemSearchRow;
  onClose: () => void;
}) {
  const t = useTranslations("admin.qa");
  const set = useQaSet(item.setId);

  const shape = t(`templates.shapes.${item.type}` as `templates.shapes.${ShapeKey}`);
  const isChoice = Boolean(item.options);
  const isMulti = item.type === "multiple_choice";
  const isFlashcard = item.type === "flashcard";

  return (
    <Dialog
      open
      size="lg"
      title={t("items.previewTitle")}
      onClose={onClose}
    >
      <div className="flex flex-col gap-6">
        <Typography variant="body-3" className="text-muted-foreground">
          {t("items.previewIntro", { shape })}
        </Typography>

        <header>
          <Typography variant="body-4" className="text-muted-foreground">
            {shape}
          </Typography>
          <Typography variant="h4" as="p" className="break-words">
            {set.data?.title ?? "\u00a0"}
          </Typography>
        </header>

        <article className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-wrap gap-2">
            <Badge>{t(`items.kinds.${item.kind}`)}</Badge>
            {item.difficulty ? (
              <Badge>{t(`items.difficulty.${item.difficulty}`)}</Badge>
            ) : null}
          </div>

          <div className="text-body-1">
            <PostContentPreview doc={item.question} />
          </div>

          {isChoice ? (
            <>
              <Typography variant="body-4" className="text-muted-foreground">
                {t(isMulti ? "items.previewMultiHint" : "items.previewSingleHint")}
              </Typography>
              <ul className="flex flex-col gap-2">
                {item.options?.map((option, index) => (
                  <li
                    key={option.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                  >
                    <Typography
                      variant="title-4"
                      as="span"
                      aria-hidden="true"
                      className={`flex size-7 shrink-0 items-center justify-center border border-border text-muted-foreground ${
                        isMulti ? "rounded-md" : "rounded-full"
                      }`}
                    >
                      {index + 1}
                    </Typography>
                    <Typography variant="body-2" as="span" className="min-w-0 flex-1">
                      {option.text}
                    </Typography>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {isFlashcard ? (
            <>
              <Typography variant="body-4" className="text-muted-foreground">
                {t("items.previewFlashHint")}
              </Typography>
              <div className="flex gap-2">
                <Button size="lg" className="flex-1" disabled>
                  <Icon icon={LUCIDE.check} />
                  {t("items.previewKnewIt")}
                </Button>
                <Button size="lg" variant="outline" className="flex-1" disabled>
                  <Icon icon={LUCIDE.x} />
                  {t("items.previewDidntKnow")}
                </Button>
              </div>
              <Typography variant="body-4" className="text-muted-foreground">
                {t("items.previewFlashNote")}
              </Typography>
            </>
          ) : null}

          {!isChoice && !isFlashcard ? (
            <Input
              label={t("items.previewAnswer")}
              hint={t("items.previewAnswerHint")}
              disabled
              readOnly
            />
          ) : null}
        </article>
      </div>
    </Dialog>
  );
}

/**
 * The preview of a question *type*: opens the modal on one question of that type.
 * The type has no example of its own, so the newest question of that shape stands
 * in; a type with no questions yet says so instead of showing an empty frame.
 */
export function QaTypePreview({
  type,
  onClose,
}: {
  type: string;
  onClose: () => void;
}) {
  const t = useTranslations("admin.qa");
  const search = useQaItemSearch({ type, limit: 1 });
  const item = search.data?.items[0];

  if (item) return <QaLearnerPreview key={item.id} item={item} onClose={onClose} />;

  return (
    <Dialog open size="lg" title={t("items.previewTitle")} onClose={onClose}>
      {search.isPending ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <Typography variant="body-3" className="text-muted-foreground">
          {t(search.isError ? "items.previewFailed" : "items.previewEmpty")}
        </Typography>
      )}
    </Dialog>
  );
}
