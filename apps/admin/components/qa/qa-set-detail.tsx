"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import type { Message } from "@noalhub/api/message";
import {
  useArchiveQaSet,
  useDeleteQaItem,
  usePublishQaSet,
  useQaSet,
  useReorderQaItems,
  type QaItemFull,
} from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError, AlertWarning } from "@noalhub/ui/alert";
import { Badge } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Typography } from "@noalhub/ui/typography";

import { AdminErrorState } from "../admin-error-state";
import { PostContentPreview } from "./post-content-preview";

/**
 * One set: its questions, their order, and the publish button.
 *
 * Two error codes come back from this screen and they must NOT share a
 * sentence: `QA_SET_CONFLICT` means someone else saved the set (reload),
 * `QA_ITEMS_REORDER_MISMATCH` means the list of questions changed underneath
 * you (reload, then reorder again). Merging them makes the reader guess.
 */
export function QaSetDetail({ setId }: { setId: string }) {
  const t = useTranslations("admin.qa");
  const m = useMessage();
  const set = useQaSet(setId);
  const publish = usePublishQaSet(setId);
  const archive = useArchiveQaSet(setId);
  const reorder = useReorderQaItems(setId);
  const [actionError, setActionError] = useState<Message | string | null>(null);

  if (set.isError) {
    return (
      <main className="w-full p-6">
        <AdminErrorState error={set.error} onRetry={() => set.refetch()} />
      </main>
    );
  }

  if (set.isPending || !set.data) {
    return (
      <main className="w-full space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  const data = set.data;
  const items = data.items;

  const run = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
    } catch (error) {
      setActionError(applyApiError(error, () => undefined, []));
    }
  };

  const move = (index: number, delta: number) => {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    // The WHOLE list goes up, not "move item X to slot 3": that makes the
    // renumbering deterministic, and turns the one wrong case (a stale list,
    // because someone deleted a question) into a 409 instead of a silent shuffle.
    void run(() =>
      reorder.mutateAsync({
        version: data.version,
        itemIds: next.map((item) => item.id),
      }),
    );
  };

  return (
    <main className="w-full p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <Typography variant="h4" as="h1">
            {data.title}
          </Typography>
          <Typography variant="body-3" className="mt-1 opacity-70">
            {data.sectionTitle
              ? t("sets.fromSection", { section: data.sectionTitle })
              : t("sets.noSection")}
          </Typography>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={data.status === "published" ? "success" : "neutral"}>
            {t(`sets.status.${data.status}`)}
          </Badge>
          {data.status === "draft" ? (
            <Button
              disabled={publish.isPending}
              onClick={() => void run(() => publish.mutateAsync(data.version))}
            >
              {t("sets.publish")}
            </Button>
          ) : null}
          {data.status === "published" ? (
            <Button
              variant="outline"
              disabled={archive.isPending}
              onClick={() => void run(() => archive.mutateAsync(data.version))}
            >
              {t("sets.archive")}
            </Button>
          ) : null}
        </div>
      </div>

      {/* The publish refusal lists the offending questions by id — show it
          verbatim, because "some question is invalid" without saying which is
          a message nobody can act on. */}
      {actionError ? (
        <div className="mt-3">
          <AlertError message={m(actionError)} />
        </div>
      ) : null}

      {data.status !== "draft" ? (
        <div className="mt-3">
          <AlertWarning message={t("sets.lockedShape")} />
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <Typography variant="body-3" className="opacity-70">
            {t("sets.noItems")}
          </Typography>
        ) : (
          items.map((item, index) => (
            <ItemCard
              key={item.id}
              setId={setId}
              item={item}
              index={index}
              total={items.length}
              onMove={move}
            />
          ))
        )}
      </div>
    </main>
  );
}

function ItemCard({
  setId,
  item,
  index,
  total,
  onMove,
}: {
  setId: string;
  item: QaItemFull;
  index: number;
  total: number;
  onMove: (index: number, delta: number) => void;
}) {
  const t = useTranslations("admin.qa");
  const remove = useDeleteQaItem(setId);

  /*
   * The correct answers are found by matching ids against `answerKey`, never by
   * looking for a `correct` flag — `options` does not carry one, on purpose:
   * one truth, one place to write it.
   */
  const correctIds =
    item.answerKey && "optionIds" in item.answerKey ? item.answerKey.optionIds : [];
  const accepted =
    item.answerKey && "accepted" in item.answerKey ? item.answerKey.accepted : [];

  return (
    <article className="rounded-md border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{t(`items.kinds.${item.kind}`)}</Badge>
            {item.difficulty ? (
              <Badge tone="neutral">{t(`items.difficulty.${item.difficulty}`)}</Badge>
            ) : null}
          </div>
          <div className="mt-2">
            <PostContentPreview doc={item.question} />
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            aria-label={t("sets.moveUp")}
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
          >
            ↑
          </Button>
          <Button
            variant="ghost"
            aria-label={t("sets.moveDown")}
            disabled={index === total - 1}
            onClick={() => onMove(index, 1)}
          >
            ↓
          </Button>
          <Button
            variant="outline"
            disabled={remove.isPending}
            onClick={() => remove.mutate(item.id)}
          >
            {t("sets.removeItem")}
          </Button>
        </div>
      </div>

      {item.options ? (
        <ul className="mt-3 space-y-1">
          {item.options.map((option) => {
            const isCorrect = correctIds.includes(option.id);
            return (
              <li
                key={option.id}
                className={`rounded-md px-2 py-1 text-body-3 ${
                  isCorrect ? "bg-success/12 text-success" : "opacity-80"
                }`}
              >
                {option.text}
                {isCorrect ? ` · ${t("sets.correct")}` : ""}
              </li>
            );
          })}
        </ul>
      ) : null}

      {accepted.length > 0 ? (
        <Typography variant="body-3" className="mt-3 opacity-80">
          {t("sets.accepted", { answers: accepted.join(" · ") })}
        </Typography>
      ) : null}

      {item.explanation ? (
        <div className="mt-3 border-t border-border pt-3">
          <Typography variant="body-4" className="text-muted-foreground">
            {t("sets.explanation")}
          </Typography>
          <PostContentPreview doc={item.explanation} />
        </div>
      ) : null}
    </article>
  );
}
