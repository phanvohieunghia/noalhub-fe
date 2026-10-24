"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { Message } from "@noalhub/api/message";
import {
  useFinishQaAttempt,
  useQaAttemptPlay,
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
import { QaContent } from "@noalhub/ui/blog/qa-content";
import { QaQuestion } from "@noalhub/ui/blog/qa-question";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { Icon, LUCIDE } from "@noalhub/ui/icons";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Tooltip } from "@noalhub/ui/tooltip";
import { Typography } from "@noalhub/ui/typography";

import { AnswerInput } from "./answer-input";
import { playCorrect, playWrong } from "./sounds";

/** Questions per progress segment. */
const SEGMENT_SIZE = 10;

/**
 * Taking a dataset, one question at a time.
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
 * Progress reads `answeredCount / attempt.itemCount`, fixed when the attempt started
 * (the learner picks how many questions), so it does not move when an admin
 * publishes more mid-attempt. A question unpublished mid-attempt just stops
 * being served; nothing the learner did is lost — the log only ever appends.
 */
export function LearnAttempt({ attemptId }: { attemptId: string }) {
  const t = useTranslations("web.learn");
  const m = useMessage();
  const router = useRouter();

  const set = useQaAttemptPlay(attemptId);
  const answered = useQaAttemptReview(attemptId);
  const submit = useSubmitQaAnswer(attemptId);
  const finish = useFinishQaAttempt();

  const [shown, setShown] = useState<{
    item: QaItemPlay;
    result: QaAnswerResult;
  } | null>(null);
  // Every answer returns the updated attempt; the attempt query is not refetched
  // per answer, so this is the fresher copy of the counters.
  const [latest, setLatest] = useState<QaAttempt | null>(null);
  const [error, setError] = useState<Message | string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  // The position label lives in a tooltip: hover/focus open it, and a tap pins
  // it for a moment (Radix itself closes on click and ignores touch).
  const [tipHover, setTipHover] = useState(false);
  const [tipPinned, setTipPinned] = useState(false);
  useEffect(() => {
    if (!tipPinned) return;
    const timer = window.setTimeout(() => setTipPinned(false), 2000);
    return () => window.clearTimeout(timer);
  }, [tipPinned]);
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
  const attempt = latest ?? set.data?.attempt;

  const send = async (response: QaResponse, durationMs: number) => {
    if (!current) return;
    setError(null);
    try {
      const result = await submit.mutateAsync({
        itemId: current.id,
        response,
        durationMs,
      });
      (result.isCorrect ? playCorrect : playWrong)();
      setShown({ item: current, result });
      setLatest(result.attempt);
      setJustAnswered((ids) => [...ids, current.id]);
      // The last answer closes the attempt — the learner is never left with an
      // "in progress" set that has nothing left to continue. If this call fails,
      // `wrapUp` retries it.
      const last = result.attempt;
      if (last.status === "in_progress" && last.answeredCount >= last.itemCount) {
        try {
          await finish.mutateAsync(attemptId);
          setLatest({ ...last, status: "finished" });
        } catch {
          // Keep the verdict on screen; finishing is retried on "review".
        }
      }
    } catch (err) {
      // A duplicate is a real case — a double click, a flaky connection. It is
      // not worth an error screen; the message says what happened.
      setError(applyApiError(err, () => undefined, []));
    }
  };

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

  // On the last question moving on clears the verdict, and `done` then turns
  // true: the summary takes over — the same step for a right and a wrong answer.
  const isLast = remaining.length === 0;
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
      next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown]);

  if (set.isPending || answered.isPending) {
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

  const total = attempt.itemCount;
  // Not while a verdict is showing: the last answer closes the attempt, and
  // that must not swap the question (and its explanation) for the summary.
  const done = !shown && (attempt.status !== "in_progress" || !current);
  const position = Math.min(total, attempt.answeredCount + (shown ? 0 : 1));
  // Past ten questions the bar is cut into sittings of ten, one segment each.
  const segments = Array.from({ length: Math.max(1, Math.ceil(total / SEGMENT_SIZE)) }, (_, i) => ({
    start: i * SEGMENT_SIZE,
    size: Math.max(1, Math.min(SEGMENT_SIZE, total - i * SEGMENT_SIZE)),
  }));
  // Self-graded wording only when the whole bank is flashcards; a mixed bank
  // counts "correct", since most of its answers are machine-graded.
  const selfGraded =
    set.data.items.length > 0 &&
    set.data.items.every((item) => item.templateKey === "flashcard");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col p-4 sm:p-6">
      {/* The summary stands alone: its own buttons say where to go next. */}
      {done ? null : (
        <header className="mb-6 space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("attempt.back")}
              className="-ml-2 shrink-0"
              // Nothing is lost by leaving (answers are saved as they go), but a
              // stray tap should not end the sitting — only ask while it is open.
              onClick={() => (done ? router.push("/learn") : setConfirmLeave(true))}
            >
              <Icon icon={LUCIDE.arrowLeft} />
            </Button>
            <Typography variant="h4" as="h1" className="min-w-0 flex-1 break-words">
              {set.data.datasetTitle}
            </Typography>
          </div>

          <Tooltip
            label={done ? t("attempt.progressLabel") : t("attempt.questionOf", { current: position, total })}
            open={tipHover || tipPinned}
            onOpenChange={setTipHover}
          >
            <div
              role="progressbar"
              tabIndex={0}
              aria-label={t("attempt.progressLabel")}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={attempt.answeredCount}
              aria-valuetext={t("attempt.questionOf", { current: position, total })}
              onClick={() => setTipPinned(true)}
              className="flex w-full cursor-pointer gap-1.5 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {segments.map(({ start, size }) => (
                <div
                  key={start}
                  // A segment is as wide as the questions it holds, so a short
                  // last one does not read as a full stretch of the set.
                  style={{ flexGrow: size, flexBasis: 0 }}
                  className="h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300"
                    style={{
                      width: `${Math.min(1, Math.max(0, (attempt.answeredCount - start) / size)) * 100}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          </Tooltip>
        </header>
      )}

      {done ? (
        <Summary
          answered={attempt.answeredCount}
          correct={attempt.correctCount}
          selfGraded={selfGraded}
          pending={finish.isPending}
          onReview={() => void wrapUp()}
        />
      ) : current ? (
        <article className="flex flex-1 flex-col gap-5">
          <div className="text-body-1 font-semibold">
            <QaQuestion doc={current.question} tagIds={current.tagIds} />
          </div>

          <AnswerInput
            key={current.id}
            item={current}
            result={shown?.result ?? null}
            disabled={submit.isPending}
            onSubmit={(response, durationMs) => void send(response, durationMs)}
          />

          {shown ? (
            <Feedback result={shown.result} onNext={next} last={isLast} />
          ) : null}

          {error ? <AlertError message={m(error)} /> : null}
        </article>
      ) : null}

      {error && done ? (
        <div className="mt-4">
          <AlertError message={m(error)} />
        </div>
      ) : null}

      {confirmLeave ? (
        <Dialog
          open
          onClose={() => setConfirmLeave(false)}
          title={t("attempt.leaveTitle")}
          tone="danger"
          icon={LUCIDE.circleX}
        >
          <Typography variant="body-3" className="text-muted-foreground">
            {t("attempt.leaveBody")}
          </Typography>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmLeave(false)}>
              {t("attempt.leaveStay")}
            </Button>
            <Button onClick={() => router.push("/learn")}>{t("attempt.leaveConfirm")}</Button>
          </div>
        </Dialog>
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

  // A machine-graded right answer is a moment to enjoy, not to study: the
  // explanation only earns its space when the learner got it wrong.
  if (good && !self) {
    return (
      <Dialog open onClose={onNext} title={verdict} icon={LUCIDE.circleCheck} tone="success" hideClose>
        {/* No button: the whole card is one — and the overlay and X already mean "next". */}
        <button
          type="button"
          onClick={onNext}
          autoFocus
          className="relative flex w-full cursor-pointer flex-col items-center gap-2 rounded-md py-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Confetti />
          <span className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
            <Icon icon={LUCIDE.circleCheck} className="size-10" />
          </span>
          <Typography variant="title-3" as="p">
            {t("attempt.celebrate")}
          </Typography>
          <Typography variant="body-4" as="p" className="text-muted-foreground">
            {t(last ? "attempt.tapSeeResult" : "attempt.tapNext")}
          </Typography>
        </button>
      </Dialog>
    );
  }

  return (
    // Closing the modal (X, Esc, overlay) is the same as "next": the verdict
    // is not something to dismiss and stay on the question.
    <Dialog
      open
      onClose={onNext}
      title={verdict}
      icon={good ? LUCIDE.circleCheck : LUCIDE.circleX}
      tone={good ? "success" : "danger"}
      hideClose
    >
      {result.answer ? (
        <div className="space-y-1">
          <Typography variant="title-4" as="h3">
            {t("attempt.answer")}
          </Typography>
          <QaContent doc={result.answer} />
        </div>
      ) : null}

      {result.explanation ? (
        <div className="space-y-1">
          <Typography variant="title-4" as="h3">
            {t("attempt.explanation")}
          </Typography>
          <QaContent doc={result.explanation} />
        </div>
      ) : null}

      <div>
        <Button onClick={onNext} autoFocus className="w-full">
          {last ? t("attempt.seeResult") : t("attempt.next")}
          <Icon icon={LUCIDE.arrowRight} />
        </Button>
      </div>
    </Dialog>
  );
}

const CONFETTI_COLORS = ["bg-success", "bg-primary", "bg-warning", "bg-brand-300", "bg-danger"];

/** A one-off burst from the centre of its parent; decorative, so hidden from assistive tech. */
function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-8 flex justify-center">
      {Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const reach = 90 + (i % 3) * 30;
        return (
          <span
            key={i}
            className={`confetti-piece absolute h-2.5 w-1.5 rounded-[1px] ${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}`}
            style={
              {
                "--x": `${Math.round(Math.cos(angle) * reach)}px`,
                "--y": `${Math.round(Math.sin(angle) * reach - 10)}px`,
                "--r": `${(i % 2 ? 1 : -1) * (180 + i * 40)}deg`,
                "--d": `${(i % 4) * 40}ms`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
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
    <section className="my-auto flex flex-col items-center gap-4 rounded-xl border border-border bg-surface px-6 py-10 text-center sm:px-10 sm:py-12">
      {/* Decorative: the trophy carries the moment, the sparkles are garnish. */}
      <div className="flex items-center gap-5">
        <Icon icon={LUCIDE.sparkles} className="size-6 text-warning" />
        <span className="flex size-18 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon icon={LUCIDE.trophy} className="size-9" />
        </span>
        <Icon icon={LUCIDE.partyPopper} className="size-6 text-accent" />
      </div>
      <div className="space-y-1">
        <Typography variant="h5" as="h2">
          {t("attempt.summaryCongrats")}
        </Typography>
        <Typography variant="body-3" className="text-muted-foreground">
          {t("attempt.summaryBody")}
        </Typography>
      </div>
      <div>
        <Typography variant="h2" as="p" className="tabular-nums">
          {correct}
          <span className="text-muted-foreground">/{answered}</span>
        </Typography>
        <Typography variant="body-3" className="text-muted-foreground">
          {t(selfGraded ? "attempt.summaryKnown" : "attempt.summaryCorrect", { rate })}
        </Typography>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={onReview} loading={pending}>
          {t("attempt.finish")}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/learn">{t("attempt.backToBrowse")}</Link>
        </Button>
      </div>
    </section>
  );
}
