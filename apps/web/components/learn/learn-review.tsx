'use client'

import {useTranslations} from 'next-intl'
import Link from 'next/link'

import {useQaAttemptReview} from '@noalhub/api/qa'
import {Badge} from '@noalhub/ui/badge'
import {Button} from '@noalhub/ui/button'
import {Icon, LUCIDE} from '@noalhub/ui/icons'
import {QaOptionCard, type QaOptionState} from '@noalhub/ui/qa-option-card'
import {QaContent} from '@noalhub/ui/blog/qa-content'
import {QaQuestion} from '@noalhub/ui/blog/qa-question'
import {Skeleton} from '@noalhub/ui/skeleton'
import {Typography} from '@noalhub/ui/typography'

/**
 * Looking back at an attempt already taken.
 *
 * This is the only place besides the moment of answering where an answer key is
 * visible, and it is safe for two reasons the backend enforces: the attempt
 * belongs to the caller, and **every question here has already been answered**.
 * A question left untouched has no entry — that is a boundary, not an omission.
 */
export function LearnReview({attemptId}: {attemptId: string}) {
  const t = useTranslations('web.learn')
  const review = useQaAttemptReview(attemptId)

  if (review.isPending) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </main>
    )
  }

  const rows = review.data ?? []

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          shape="circle"
          asChild
          aria-label={t('attempt.back')}
          className="-ml-2 shrink-0">
          <Link href="/learn/history">
            <Icon icon={LUCIDE.arrowLeft} />
          </Link>
        </Button>
        <Typography variant="h4" as="h1" className="min-w-0 flex-1 truncate">
          {t('review.title')}
        </Typography>
      </div>

      <div className="mt-6 space-y-4">
        {rows.length === 0 ? (
          <Typography variant="body-3" className="opacity-70">
            {t('review.empty')}
          </Typography>
        ) : (
          rows.map((row) => (
            <article
              key={row.itemId}
              className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{t(`kinds.${row.kind}`)}</Badge>
                {/* Self-assessed answers are labelled, because they mean
                    something different from a machine-checked one. */}
                {row.grading === 'self' ? (
                  <Badge tone="info">{t('review.selfGraded')}</Badge>
                ) : null}
              </div>

              {/* The tag label overhangs the frame's top edge, so the gap has to clear it. */}
              <div className="mt-5">
                <QaQuestion doc={row.question} tagIds={row.tagIds} />
              </div>

              {row.options ? (
                // The verdict lives on the answers, as it did while answering: the right
                // option(s) go green, and a pick that was not right goes red beside them.
                <div role="list" className="mt-3 space-y-2">
                  {row.options.map((option) => {
                    const picks =
                      'optionIds' in row.response ? row.response.optionIds : []
                    const chosen = picks.includes(option.id)
                    const state: QaOptionState =
                      row.correctOptionIds.length > 0
                        ? row.correctOptionIds.includes(option.id)
                          ? 'right'
                          : chosen
                            ? 'wrong'
                            : 'dimmed'
                        : // No key from the server: colour only what the verdict allows.
                          !chosen
                          ? 'dimmed'
                          : row.isCorrect
                            ? 'right'
                            : picks.length === 1
                              ? 'wrong'
                              : 'chosen'
                    return (
                      <div key={option.id} role="listitem">
                        <QaOptionCard
                          text={option.text}
                          role={picks.length > 1 ? 'checkbox' : 'radio'}
                          shape={picks.length > 1 ? 'square' : 'round'}
                          state={state}
                          disabled
                          centered={false}
                          onClick={() => undefined}
                        />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <Verdict
                  good={row.isCorrect}
                  label={
                    'text' in row.response
                      ? t('review.youWrote', {text: row.response.text})
                      : row.grading === 'self'
                        ? t(
                            row.isCorrect
                              ? 'attempt.selfKnown'
                              : 'attempt.selfUnknown',
                          )
                        : t(row.isCorrect ? 'review.correct' : 'review.wrong')
                  }
                />
              )}

              {row.answer ? (
                <div className="mt-3 border-t border-border pt-3">
                  <Typography variant="title-4">
                    {t('attempt.answer')}
                  </Typography>
                  <QaContent doc={row.answer} />
                </div>
              ) : null}

              {row.explanation ? (
                <div className="mt-3 border-t border-border pt-3">
                  <Typography variant="title-4">
                    {t('attempt.explanation')}
                  </Typography>
                  <QaContent doc={row.explanation} />
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </main>
  )
}

/** The verdict for an answer with no options to colour: a typed text or a flashcard. */
function Verdict({good, label}: {good: boolean; label: string}) {
  return (
    <Typography
      variant="body-3"
      className={`mt-3 flex items-start gap-2 rounded-md border px-3 py-2 ${
        good
          ? 'border-success/40 bg-success/12'
          : 'border-danger/40 bg-danger/12'
      }`}>
      <Icon
        icon={good ? LUCIDE.circleCheck : LUCIDE.circleX}
        className={`mt-0.5 size-4 shrink-0 ${good ? 'text-success' : 'text-danger'}`}
      />
      {label}
    </Typography>
  )
}
