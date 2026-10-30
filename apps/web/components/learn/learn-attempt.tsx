'use client'

import {useTranslations} from 'next-intl'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useEffect, useMemo, useState} from 'react'

import type {Message} from '@noalhub/api/message'
import {
  useFinishQaAttempt,
  useQaAttemptPlay,
  useQaAttemptReview,
  useStartQaAttempt,
  useSubmitQaAnswer,
  type QaAnswerResult,
  type QaAttempt,
  type QaItemPlay,
  type QaResponse,
} from '@noalhub/api/qa'
import {applyApiError} from '@noalhub/core/forms/apply-api-error'
import {useMessage} from '@noalhub/i18n/use-message'
import {QaContent} from '@noalhub/ui/blog/qa-content'
import {QaQuestion} from '@noalhub/ui/blog/qa-question'
import {Button} from '@noalhub/ui/button'
import {Dialog} from '@noalhub/ui/dialog'
import {Icon, LUCIDE} from '@noalhub/ui/icons'
import {Skeleton} from '@noalhub/ui/skeleton'
import {Tooltip} from '@noalhub/ui/tooltip'
import {Typography} from '@noalhub/ui/typography'

import {AnswerInput} from './answer-input'
import {playCorrect, playWrong, unlockSounds} from '@noalhub/core/sounds'
import {ToastError} from '@noalhub/ui/toast'

/** Questions per progress section, once the set is long enough to need sections. */
const SECTION_SIZE = 10
/** Up to this many questions the progress is one bar of per-question cells. */
const SINGLE_BAR_MAX = 10

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
/** How long the header stays down before it folds away again. */
const HEADER_VISIBLE_MS = 3000

/**
 * The URL names the **set**, not an attempt: the attempt is resolved on every load
 * (starting one is idempotent — an open attempt comes back as itself), so a reload,
 * or another device, always lands on whatever is currently open for this set instead
 * of an attempt id that may have been finished elsewhere.
 */
export function LearnAttempt({datasetId}: {datasetId: string}) {
  const t = useTranslations('web.learn')
  const start = useStartQaAttempt()
  const {mutate} = start
  useEffect(() => mutate({datasetId}), [mutate, datasetId])

  if (start.data) return <LearnAttemptRun attemptId={start.data.id} />
  if (start.isError) {
    return (
      <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <Typography variant="h5" as="h1">
          {t('attempt.notFound')}
        </Typography>
      </main>
    )
  }
  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </main>
  )
}

function LearnAttemptRun({attemptId}: {attemptId: string}) {
  const t = useTranslations('web.learn')
  const m = useMessage()
  const router = useRouter()

  const set = useQaAttemptPlay(attemptId)
  const answered = useQaAttemptReview(attemptId)
  const submit = useSubmitQaAnswer(attemptId)
  const finish = useFinishQaAttempt()

  const [shown, setShown] = useState<{
    item: QaItemPlay
    result: QaAnswerResult
  } | null>(null)
  // Every answer returns the updated attempt; the attempt query is not refetched
  // per answer, so this is the fresher copy of the counters.
  const [latest, setLatest] = useState<QaAttempt | null>(null)
  const [error, setError] = useState<Message | string | null>(null)
  const [confirmLeave, setConfirmLeave] = useState(false)
  // The position label lives in a tooltip: hover/focus open it, and a tap pins
  // it for a moment (Radix itself closes on click and ignores touch).
  const [tipHover, setTipHover] = useState(false)
  const [tipPinned, setTipPinned] = useState(false)
  useEffect(() => {
    if (!tipPinned) return
    const timer = window.setTimeout(() => setTipPinned(false), 2000)
    return () => window.clearTimeout(timer)
  }, [tipPinned])
  // The header is there on arrival, folds away after a few seconds to give the
  // question the room, and the handle brings it back for the same few seconds.
  const [headerOpen, setHeaderOpen] = useState(true)
  useEffect(() => {
    if (!headerOpen) return
    const timer = window.setTimeout(
      () => setHeaderOpen(false),
      HEADER_VISIBLE_MS,
    )
    return () => window.clearTimeout(timer)
  }, [headerOpen])
  // The verdict rings when the server answers, after the tap that sent the answer
  // is over — and some browsers start audio only from inside a tap, so the
  // sitting's first tap does it.
  useEffect(() => unlockSounds(), [])
  // Answered here, this session. The review refetch catches up on its own, but
  // "next" can be clicked before it lands — and the question it would bring
  // back is one the backend already refuses as a duplicate.
  const [justAnswered, setJustAnswered] = useState<string[]>([])

  const answeredIds = useMemo(
    () =>
      new Set([
        ...(answered.data ?? []).map((row) => row.itemId),
        ...justAnswered,
      ]),
    [answered.data, justAnswered],
  )
  const remaining = (set.data?.items ?? []).filter(
    (item) => !answeredIds.has(item.id) && item.id !== shown?.item.id,
  )
  const current = shown?.item ?? remaining[0]
  const attempt = latest ?? set.data?.attempt

  const send = async (response: QaResponse, durationMs: number) => {
    if (!current) return
    setError(null)
    try {
      const result = await submit.mutateAsync({
        itemId: current.id,
        response,
        durationMs,
      })
      ;(result.isCorrect ? playCorrect : playWrong)()
      setShown({item: current, result})
      setLatest(result.attempt)
      setJustAnswered((ids) => [...ids, current.id])
      // The last answer closes the attempt — the learner is never left with an
      // "in progress" set that has nothing left to continue. If this call fails,
      // `wrapUp` retries it.
      const last = result.attempt
      if (
        last.status === 'in_progress' &&
        last.answeredCount >= last.itemCount
      ) {
        try {
          await finish.mutateAsync(attemptId)
          setLatest({...last, status: 'finished'})
        } catch {
          // Keep the verdict on screen; finishing is retried on "review".
        }
      }
    } catch (err) {
      // A duplicate is a real case — a double click, a flaky connection. It is
      // not worth an error screen; the message says what happened.
      setError(applyApiError(err, () => undefined, []))
    }
  }

  const wrapUp = async () => {
    setError(null)
    try {
      // A finished attempt answers 409 to a second finish; there is nothing to
      // close, so go straight to the review.
      if (attempt?.status === 'in_progress') await finish.mutateAsync(attemptId)
      router.push(`/learn/attempts/${attemptId}/review`)
    } catch (err) {
      setError(applyApiError(err, () => undefined, []))
    }
  }

  // On the last question moving on clears the verdict, and `done` then turns
  // true: the summary takes over — the same step for a right and a wrong answer.
  const isLast = remaining.length === 0
  const next = () => {
    setShown(null)
    setError(null)
  }

  // Enter moves on once the verdict is in — the same key that answered.
  useEffect(() => {
    if (!shown) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return
      const target = event.target as HTMLElement | null
      if (target?.closest('button, textarea, [contenteditable]')) return
      event.preventDefault()
      next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shown])

  if (set.isPending || answered.isPending) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </main>
    )
  }

  if (!attempt || !set.data) {
    return (
      <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
        <Typography variant="h5" as="h1">
          {t('attempt.notFound')}
        </Typography>
      </main>
    )
  }

  const total = attempt.itemCount
  // Not while a verdict is showing: the last answer closes the attempt, and
  // that must not swap the question (and its explanation) for the summary.
  const done = !shown && (attempt.status !== 'in_progress' || !current)
  const position = Math.min(total, attempt.answeredCount + (shown ? 0 : 1))
  // Every question is one cell. A short set is a single bar; past ten the bar
  // is cut into sections of ten cells each.
  const sectionSize =
    total <= SINGLE_BAR_MAX ? Math.max(1, total) : SECTION_SIZE
  const sections = Array.from(
    {length: Math.max(1, Math.ceil(total / sectionSize))},
    (_, i) => ({
      start: i * sectionSize,
      size: Math.max(1, Math.min(sectionSize, total - i * sectionSize)),
    }),
  )
  // Self-graded wording only when the whole bank is flashcards; a mixed bank
  // counts "correct", since most of its answers are machine-graded.
  const selfGraded =
    set.data.items.length > 0 &&
    set.data.items.every((item) => item.templateKey === 'flashcard')

  return (
    <main
      className={`mx-auto flex w-full max-w-3xl flex-col p-4 sm:p-6 ${
        // While answering, the screen is exactly the visible viewport (dvh follows the
        // mobile browser's collapsing address bar): the answers scroll inside it, the
        // page itself does not. The summary is an ordinary scrolling page.
        done ? 'flex-1' : 'h-dvh pt-2 sm:pt-3'
      }`}>
      {/* The summary stands alone: its own buttons say where to go next. */}
      {done ? null : (
        <header className="shrink-0">
          {/* The title row folds with a grid-row transition so the question below slides
            up with it; `inert` keeps the folded controls out of the tab order. The
            progress bar stays. */}
          <div
            inert={!headerOpen}
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:duration-200 ${
              headerOpen
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            }`}>
            {/* The fold clips (overflow-hidden), so the padding must cover the back button's
                -ml-2 and its hover circle, or the circle is cut off on the left. */}
            <div className="-mx-3 -my-1 min-h-0 overflow-hidden px-3 py-1">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  shape="circle"
                  aria-label={t('attempt.back')}
                  className="-ml-2 shrink-0"
                  // Nothing is lost by leaving (answers are saved as they go), but a
                  // stray tap should not end the sitting — only ask while it is open.
                  onClick={() =>
                    done ? router.push('/learn') : setConfirmLeave(true)
                  }>
                  <Icon icon={LUCIDE.arrowLeft} />
                </Button>
                {/* One line with an ellipsis; the full title is the tooltip. */}
                <Tooltip label={set.data.datasetTitle} side="bottom">
                  <Typography
                    variant="h4"
                    as="h1"
                    className="min-w-0 flex-1 truncate">
                    {set.data.datasetTitle}
                  </Typography>
                </Tooltip>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip
              label={
                done
                  ? t('attempt.progressLabel')
                  : t('attempt.questionOf', {current: position, total})
              }
              open={tipHover || tipPinned}
              onOpenChange={setTipHover}>
              <div
                role="progressbar"
                tabIndex={0}
                aria-label={t('attempt.progressLabel')}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={attempt.answeredCount}
                aria-valuetext={t('attempt.questionOf', {
                  current: position,
                  total,
                })}
                onClick={() => setTipPinned(true)}
                className="flex min-w-0 flex-1 cursor-pointer gap-1.5 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                {sections.map(({start, size}) => (
                  <div
                    key={start}
                    // A section is as wide as the questions it holds, so a short
                    // last one does not read as a full stretch of the set.
                    style={{flexGrow: size, flexBasis: 0}}
                    className="flex gap-0.5 rounded-md border border-border p-0.5">
                    {Array.from({length: size}, (_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-xs transition-colors duration-300 ${
                          start + i < attempt.answeredCount
                            ? 'bg-primary'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </Tooltip>
            <Button
              variant="ghost"
              size="icon"
              shape="circle"
              aria-label={t(
                headerOpen ? 'attempt.hideHeader' : 'attempt.showHeader',
              )}
              aria-expanded={headerOpen}
              onClick={() => setHeaderOpen((open) => !open)}
              className="-mr-2 shrink-0">
              <Icon icon={headerOpen ? LUCIDE.chevronUp : LUCIDE.chevronDown} />
            </Button>
          </div>
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
        <article className="flex min-h-0 flex-1 flex-col gap-5">
          {/* The whole question (text, frame, picture) stays under half the screen, and the
              picture is what shrinks to make it so — the answers keep their room. */}
          <div className="flex max-h-[45vh] min-h-0 shrink-0 flex-col text-body-1 font-semibold [&>div]:flex [&>div]:min-h-0 [&>div]:flex-col">
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
        </article>
      ) : null}

      <ToastError message={error ? m(error) : null} />

      {/* The verdict is in, so the next question's pictures start loading now rather
          than on "next". They are optimised by `next/image`, so only rendering the real
          thing warms the right file; it is clipped to a pixel and invisible. */}
      {shown && !isLast && remaining[0] ? (
        <div
          aria-hidden
          inert
          className="pointer-events-none fixed top-0 left-0 -z-10 h-px w-full overflow-hidden opacity-0">
          <QaQuestion
            doc={remaining[0].question}
            tagIds={remaining[0].tagIds}
          />
        </div>
      ) : null}

      {confirmLeave ? (
        <Dialog
          open
          onClose={() => setConfirmLeave(false)}
          title={t('attempt.leaveTitle')}
          tone="danger"
          icon={LUCIDE.circleX}>
          <Typography variant="body-3" className="text-muted-foreground">
            {t('attempt.leaveBody')}
          </Typography>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmLeave(false)}>
              {t('attempt.leaveStay')}
            </Button>
            <Button onClick={() => router.push('/learn')}>
              {t('attempt.leaveConfirm')}
            </Button>
          </div>
        </Dialog>
      ) : null}
    </main>
  )
}

const PANEL = 'rounded-lg border bg-background/40 p-3'

/** The verdict, the answer and the explanation — then the way forward. */
function Feedback({
  result,
  last,
  onNext,
}: {
  result: QaAnswerResult
  last: boolean
  onNext: () => void
}) {
  const t = useTranslations('web.learn')
  const self = result.grading === 'self'
  const good = result.isCorrect

  const verdict = self
    ? t(good ? 'attempt.selfKnown' : 'attempt.selfUnknown')
    : t(good ? 'attempt.correct' : 'attempt.wrong')

  // A machine-graded right answer with nothing to explain is a moment to enjoy: one
  // tap to move on. When there is an explanation it is shown too (below), so a
  // right answer is still something to learn from.
  const celebrate = good && !self
  // The answer and the explanation sit in bordered panels tinted by the verdict.
  const panelTone = good ? 'border-success/40' : 'border-danger/40'

  // With an explanation there is no button (a right answer is not a decision), so the
  // card says "tap anywhere": Enter, or a click inside it, moves on — as the overlay
  // and Esc already do. A click that ends a text selection is the learner copying
  // the explanation, not asking to leave.
  useEffect(() => {
    if (!celebrate) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.repeat) onNext()
    }
    const onClick = (event: MouseEvent) => {
      const inside = (event.target as Element | null)?.closest(
        '[role="dialog"]',
      )
      if (inside && !window.getSelection()?.toString()) onNext()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('click', onClick)
    }
  }, [celebrate, onNext])

  if (celebrate && !result.explanation) {
    return (
      <Dialog
        open
        onClose={onNext}
        title={verdict}
        icon={LUCIDE.circleCheck}
        tone="success"
        hideClose
        blurOverlay>
        {/* No button: the whole card is one — and the overlay and X already mean "next". */}
        <button
          type="button"
          onClick={onNext}
          autoFocus
          className="relative flex w-full cursor-pointer flex-col items-center gap-2 rounded-md py-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Confetti />
          <span className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
            <Icon icon={LUCIDE.circleCheck} className="size-10" />
          </span>
          <Typography variant="title-3" as="p">
            {t('attempt.celebrate')}
          </Typography>
          <Typography variant="body-4" as="p" className="text-muted-foreground">
            {t(last ? 'attempt.tapSeeResult' : 'attempt.tapNext')}
          </Typography>
        </button>
      </Dialog>
    )
  }

  return (
    // Closing the modal (X, Esc, overlay) is the same as "next": the verdict
    // is not something to dismiss and stay on the question.
    <Dialog
      open
      onClose={onNext}
      title={verdict}
      icon={good ? LUCIDE.circleCheck : LUCIDE.circleX}
      tone={good ? 'success' : 'danger'}
      hideClose
      centered
      blurOverlay>
      {celebrate ? (
        <div className="relative flex justify-center">
          <Confetti />
          <Typography
            variant="body-3"
            as="p"
            className="text-center text-muted-foreground">
            {t('attempt.celebrate')}
          </Typography>
        </div>
      ) : null}

      {result.answer && !celebrate ? (
        <div className={`space-y-1 ${PANEL} ${panelTone}`}>
          <Typography variant="title-4" as="h3">
            {t('attempt.answer')}
          </Typography>
          <QaContent doc={result.answer} />
        </div>
      ) : null}

      {result.explanation ? (
        <div className={`space-y-1 ${PANEL} ${panelTone}`}>
          <Typography variant="title-4" as="h3">
            {t('attempt.explanation')}
          </Typography>
          <QaContent doc={result.explanation} />
        </div>
      ) : null}

      {celebrate ? (
        <Typography
          variant="body-4"
          as="p"
          className="text-center text-muted-foreground">
          {t(last ? 'attempt.tapSeeResult' : 'attempt.tapNext')}
        </Typography>
      ) : (
        <div>
          <Button onClick={onNext} autoFocus className="w-full">
            {last ? t('attempt.seeResult') : t('attempt.next')}
            <Icon icon={LUCIDE.arrowRight} />
          </Button>
        </div>
      )}
    </Dialog>
  )
}

const CONFETTI_COLORS = [
  'bg-success',
  'bg-primary',
  'bg-warning',
  'bg-brand-300',
  'bg-danger',
]

/** A one-off burst from the centre of its parent; decorative, so hidden from assistive tech. */
function Confetti() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-8 flex justify-center">
      {Array.from({length: 18}, (_, i) => {
        const angle = (i / 18) * Math.PI * 2
        const reach = 90 + (i % 3) * 30
        return (
          <span
            key={i}
            className={`confetti-piece absolute h-2.5 w-1.5 rounded-[1px] ${CONFETTI_COLORS[i % CONFETTI_COLORS.length]}`}
            style={
              {
                '--x': `${Math.round(Math.cos(angle) * reach)}px`,
                '--y': `${Math.round(Math.sin(angle) * reach - 10)}px`,
                '--r': `${(i % 2 ? 1 : -1) * (180 + i * 40)}deg`,
                '--d': `${(i % 4) * 40}ms`,
              } as React.CSSProperties
            }
          />
        )
      })}
    </div>
  )
}

function Summary({
  answered,
  correct,
  selfGraded,
  pending,
  onReview,
}: {
  answered: number
  correct: number
  selfGraded: boolean
  pending: boolean
  onReview: () => void
}) {
  const t = useTranslations('web.learn')
  const rate = answered > 0 ? Math.round((correct / answered) * 100) : 0

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
          {t('attempt.summaryCongrats')}
        </Typography>
        <Typography variant="body-3" className="text-muted-foreground">
          {t('attempt.summaryBody')}
        </Typography>
      </div>
      <div>
        <Typography variant="h2" as="p" className="tabular-nums">
          {correct}
          <span className="text-muted-foreground">/{answered}</span>
        </Typography>
        <Typography variant="body-3" className="text-muted-foreground">
          {t(selfGraded ? 'attempt.summaryKnown' : 'attempt.summaryCorrect', {
            rate,
          })}
        </Typography>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={onReview} loading={pending}>
          {t('attempt.finish')}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/learn">{t('attempt.backToBrowse')}</Link>
        </Button>
      </div>
    </section>
  )
}
