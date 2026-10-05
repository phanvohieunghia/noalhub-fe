"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { Message } from "@noalhub/api/message";
import {
  useFinishQaAttempt,
  usePlayQaSet,
  useQaAttempts,
  useQaAttemptReview,
  useSubmitQaAnswer,
  type QaAnswerResult,
  type QaAttempt,
  type QaItemPlay,
  type QaResponse,
} from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError } from "@noalhub/ui/alert";
import { Badge } from "@noalhub/ui/badge";
import { PostContent } from "@noalhub/ui/blog/post-content";
import { Button } from "@noalhub/ui/button";
import { Icon, LUCIDE } from "@noalhub/ui/icons";
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
 * The question on screen is **pinned** while its result is showing. Submitting
 * refetches the attempt review, which removes the question just answered from
 * `remaining` — reading `remaining[0]` there would swap the question out from
 * under its own explanation, and on the last one leave nothing on screen.
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
  const listed = attempts.data?.find((row) => row.id === attemptId);
  const set = usePlayQaSet(listed?.setId);
  const answered = useQaAttemptReview(attemptId);
  const submit = useSubmitQaAnswer(attemptId);
  const finish = useFinishQaAttempt();

  const [shown, setShown] = useState<{
    item: QaItemPlay;
    result: QaAnswerResult;
  } | null>(null);
  // Every answer returns the updated attempt; the list query is not refetched
  // per answer, so this is the fresher copy of the counters.
  const [latest, setLatest] = useState<QaAttempt | null>(null);
  const [error, setError] = useState<Message | string | null>(null);
  // Answered here, this session. The review refetch catches up on its own, but
  // "next" can be clicked before it lands — and the question it would bring
  // back is one the backend already refuses as a duplicate.
  const [justAnswered, setJustAnswered] = useState<string[]>([]);

  const answeredIds = useMemo(
    () =>
      new Set([...(answered.data ?? []).map((row) => row.itemId), ...justAnswered]),
    [answered.data, justAnswered],
  );
  const remaining = (set.data?.items ?? []).filter(
    (item) => !answeredIds.has(item.id) && item.id !== shown?.item.id,
  );
  const current = shown?.item ?? remaining[0];
  const attempt = latest ?? listed;

  const send = async (response: QaResponse, durationMs: number) => {
    if (!current) return;
    setError(null);
    try {
      const result = await submit.mutateAsync({
        itemId: current.id,
        response,
        durationMs,
      });
      setShown({ item: current, result });
      setLatest(result.attempt);
      setJustAnswered((ids) => [...ids, current.id]);
    } catch (err) {
      // A duplicate is a real case — a double click, a flaky connection. It is
      // not worth an error screen; the message says what happened.
      setError(applyApiError(err, () => undefined, []));
    }
  };

  const next = () => {
    setShown(null);
    setError(null);
  };

  // Enter moves on once the verdict is in — the same key that answered.
  useEffect(() => {
    if (!shown) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, textarea, [contenteditable]")) return;
      event.preventDefault();
      setShown(null);
      setError(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown]);

  const wrapUp = async () => {
    setError(null);
    try {
      // A finished attempt answers 409 to a second finish; there is nothing to
      // close, so go straight to the review.
      if (attempt?.status === "in_progress") await finish.mutateAsync(attemptId);
      router.push(`/learn/attempts/${attemptId}/review`);
    } catch (err) {
      setError(applyApiError(err, () => undefined, []));
    }
  };

  if (attempts.isPending || set.isPending || answered.isPending) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </main>
    );
  }

  if (!attempt || !set.data) {
    return (
      <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <Typography variant="h5" as="h1">
          {t("attempt.notFound")}
        </Typography>
      </main>
    );
  }

  const total = set.data.itemCount;
  const done = attempt.status !== "in_progress" || !current;
  const position = Math.min(total, attempt.answeredCount + (shown ? 0 : 1));
  const percent = total > 0 ? Math.round((attempt.answeredCount / total) * 100) : 0;
  const selfGraded = set.data.templateKey === "flashcard";

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Typography variant="body-4" className="text-muted-foreground">
              {t(`shapes.${set.data.templateKey}`)}
            </Typography>
            <Typography variant="h4" as="h1" className="break-words">
              {set.data.title}
            </Typography>
          </div>
          <Badge tone="success" className="shrink-0">
            {t(selfGraded ? "attempt.knownSoFar" : "attempt.correctSoFar", {
              count: attempt.correctCount,
            })}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-label={t("attempt.progressLabel")}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={attempt.answeredCount}
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          {!done ? (
            <Typography variant="body-4" className="shrink-0 tabular-nums text-muted-foreground">
              {t("attempt.questionOf", { current: position, total })}
            </Typography>
          ) : null}
        </div>
      </header>

      {done ? (
        <Summary
          answered={attempt.answeredCount}
          correct={attempt.correctCount}
          selfGraded={selfGraded}
          pending={finish.isPending}
          onReview={() => void wrapUp()}
        />
      ) : current ? (
        <article className="mt-6 space-y-5 rounded-xl border border-border bg-surface p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">{t(`kinds.${current.kind}`)}</Badge>
            {current.difficulty ? (
              <Badge tone="info">{t(`difficulty.${current.difficulty}`)}</Badge>
            ) : null}
          </div>

          <div className="text-body-1">
            <PostContent doc={current.question} />
          </div>

          <AnswerInput
            key={current.id}
            templateKey={set.data.templateKey}
            item={current}
            result={shown?.result ?? null}
            disabled={submit.isPending}
            onSubmit={(response, durationMs) => void send(response, durationMs)}
          />

          {shown ? (
            <Feedback result={shown.result} onNext={next} last={remaining.length === 0} />
          ) : null}

          {error ? <AlertError message={m(error)} /> : null}
        </article>
      ) : null}

      {error && done ? (
        <div className="mt-4">
          <AlertError message={m(error)} />
        </div>
      ) : null}
    </main>
  );
}

/** The verdict, the answer and the explanation — then the way forward. */
function Feedback({
  result,
  last,
  onNext,
}: {
  result: QaAnswerResult;
  last: boolean;
  onNext: () => void;
}) {
  const t = useTranslations("web.learn");
  const self = result.grading === "self";
  const good = result.isCorrect;

  const verdict = self
    ? t(good ? "attempt.selfKnown" : "attempt.selfUnknown")
    : t(good ? "attempt.correct" : "attempt.wrong");

  return (
    <section
      aria-live="polite"
      className={`space-y-4 rounded-lg border p-4 ${
        good ? "border-success/40 bg-success/8" : "border-danger/40 bg-danger/8"
      }`}
    >
      <div className={`flex items-center gap-2 ${good ? "text-success" : "text-danger"}`}>
        <Icon icon={good ? LUCIDE.circleCheck : LUCIDE.circleX} className="size-5" />
        <Typography variant="title-3" as="p">
          {verdict}
        </Typography>
      </div>

      {result.answer ? (
        <div className="space-y-1">
          <Typography variant="title-4" as="h3">
            {t("attempt.answer")}
          </Typography>
          <PostContent doc={result.answer} />
        </div>
      ) : null}

      {result.explanation ? (
        <div className="space-y-1">
          <Typography variant="title-4" as="h3">
            {t("attempt.explanation")}
          </Typography>
          <PostContent doc={result.explanation} />
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button onClick={onNext} autoFocus>
          {last ? t("attempt.seeResult") : t("attempt.next")}
          <Icon icon={LUCIDE.arrowRight} />
        </Button>
      </div>
    </section>
  );
}

function Summary({
  answered,
  correct,
  selfGraded,
  pending,
  onReview,
}: {
  answered: number;
  correct: number;
  selfGraded: boolean;
  pending: boolean;
  onReview: () => void;
}) {
  const t = useTranslations("web.learn");
  const rate = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  return (
    <section className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-6 text-center sm:p-10">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon icon={LUCIDE.trophy} className="size-7" />
      </span>
      <Typography variant="h5" as="h2">
        {t("attempt.summaryTitle")}
      </Typography>
      <div>
        <p className="text-h2 font-semibold tabular-nums">
          {correct}
          <span className="text-muted-foreground">/{answered}</span>
        </p>
        <Typography variant="body-3" className="text-muted-foreground">
          {t(selfGraded ? "attempt.summaryKnown" : "attempt.summaryCorrect", { rate })}
        </Typography>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={onReview} disabled={pending}>
          {t("attempt.finish")}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/learn">{t("attempt.backToBrowse")}</Link>
        </Button>
      </div>
    </section>
  );
}
