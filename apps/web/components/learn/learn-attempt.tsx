"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { Message } from "@noalhub/api/message";
import {
  useFinishQaAttempt,
  usePlayQaSet,
  useQaAttempts,
  useQaAttemptReview,
  useSubmitQaAnswer,
  type QaAnswerResult,
  type QaResponse,
} from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError, AlertSuccess, AlertWarning } from "@noalhub/ui/alert";
import { PostContent } from "@noalhub/ui/blog/post-content";
import { Button } from "@noalhub/ui/button";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Typography } from "@noalhub/ui/typography";

import { AnswerInput } from "./answer-input";

/**
 * Taking a set, one question at a time.
 *
 * The result of each answer comes back with the explanation for **that**
 * question, and that is the only moment an answer is visible. There is no "peek
 * at the answer" affordance because there is no API behind one — by design.
 *
 * Progress reads `answeredCount / set.itemCount`. If an admin soft-deletes a
 * question mid-attempt the denominator moves (8/10 → 8/9); that is intended,
 * and nothing the learner did is lost — the log only ever appends.
 */
export function LearnAttempt({ attemptId }: { attemptId: string }) {
  const t = useTranslations("web.learn");
  const m = useMessage();
  const router = useRouter();

  const attempts = useQaAttempts();
  const attempt = attempts.data?.find((row) => row.id === attemptId);
  const set = usePlayQaSet(attempt?.setId);
  const answered = useQaAttemptReview(attemptId);
  const submit = useSubmitQaAnswer(attemptId);
  const finish = useFinishQaAttempt();

  const [result, setResult] = useState<QaAnswerResult | null>(null);
  const [error, setError] = useState<Message | string | null>(null);

  const answeredIds = useMemo(
    () => new Set((answered.data ?? []).map((row) => row.itemId)),
    [answered.data],
  );
  const remaining = (set.data?.items ?? []).filter(
    (item) => !answeredIds.has(item.id),
  );
  const current = remaining[0];

  const send = async (response: QaResponse) => {
    if (!current) return;
    setError(null);
    try {
      setResult(await submit.mutateAsync({ itemId: current.id, response }));
    } catch (err) {
      // A duplicate is a real case — a double click, a flaky connection. It is
      // not worth an error screen; the result already on screen still stands.
      setError(applyApiError(err, () => undefined, []));
    }
  };

  if (attempts.isPending || set.isPending || answered.isPending) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </main>
    );
  }

  if (!attempt || !set.data) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <Typography variant="h5" as="h1">
          {t("attempt.notFound")}
        </Typography>
      </main>
    );
  }

  const done = attempt.status !== "in_progress" || (!current && !result);

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Typography variant="h4" as="h1">
          {set.data.title}
        </Typography>
        <Typography variant="body-3" className="opacity-70">
          {t("attempt.progress", {
            answered: attempt.answeredCount,
            total: set.data.itemCount,
            correct: attempt.correctCount,
          })}
        </Typography>
      </div>

      {done ? (
        <div className="mt-6 space-y-3">
          <AlertSuccess
            message={t("attempt.finished", {
              correct: attempt.correctCount,
              answered: attempt.answeredCount,
            })}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                void finish.mutateAsync(attemptId).then(() => {
                  router.push(`/learn/attempts/${attemptId}/review`);
                });
              }}
            >
              {t("attempt.finish")}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/learn">{t("attempt.backToBrowse")}</Link>
            </Button>
          </div>
        </div>
      ) : current ? (
        <article className="mt-6 space-y-4 rounded-lg border border-border p-4">
          <PostContent doc={current.question} />

          {result ? (
            <div className="space-y-3">
              {result.isCorrect ? (
                <AlertSuccess message={t("attempt.correct")} />
              ) : (
                <AlertWarning message={t("attempt.wrong")} />
              )}
              {result.answer ? (
                <div>
                  <Typography variant="title-4">{t("attempt.answer")}</Typography>
                  <PostContent doc={result.answer} />
                </div>
              ) : null}
              {result.explanation ? (
                <div>
                  <Typography variant="title-4">{t("attempt.explanation")}</Typography>
                  <PostContent doc={result.explanation} />
                </div>
              ) : null}
              <Button onClick={() => setResult(null)}>{t("attempt.next")}</Button>
            </div>
          ) : (
            <AnswerInput
              templateKey={set.data.templateKey}
              item={current}
              disabled={submit.isPending}
              onSubmit={(response) => void send(response)}
            />
          )}

          {error ? <AlertError message={m(error)} /> : null}
        </article>
      ) : null}
    </main>
  );
}
