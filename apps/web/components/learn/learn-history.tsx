'use client'

import {useTranslations} from 'next-intl'
import Link from 'next/link'
import {useMemo} from 'react'

import {
  useBrowseQaDatasets,
  useQaAttempts,
  type QaAttempt,
} from '@noalhub/api/qa'
import {useDateFormat} from '@noalhub/i18n/use-date-format'
import {Badge} from '@noalhub/ui/badge'
import {Button} from '@noalhub/ui/button'
import {Icon, LUCIDE} from '@noalhub/ui/icons'
import {Skeleton} from '@noalhub/ui/skeleton'
import {Typography} from '@noalhub/ui/typography'

/**
 * Every attempt the learner has taken, newest first; one tap opens its review.
 *
 * Only attempts with at least one answer are listed — an attempt opened and left
 * untouched has nothing to review. The title comes from the published datasets: a
 * bank an admin has since withdrawn still has its attempts, just without a name.
 */
export function LearnHistory() {
  const t = useTranslations('web.learn')
  const df = useDateFormat()
  const attempts = useQaAttempts()
  const datasets = useBrowseQaDatasets()

  const titles = useMemo(
    () =>
      new Map((datasets.data?.items ?? []).map((row) => [row.id, row.title])),
    [datasets.data],
  )
  const rows = useMemo(
    () =>
      (attempts.data ?? [])
        .filter((attempt) => attempt.answeredCount > 0)
        .sort(
          (a, b) =>
            new Date(b.finishedAt ?? b.startedAt).getTime() -
            new Date(a.finishedAt ?? a.startedAt).getTime(),
        ),
    [attempts.data],
  )

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6">
      <header className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          shape="circle"
          asChild
          aria-label={t('attempt.back')}
          className="-ml-2 shrink-0">
          <Link href="/learn">
            <Icon icon={LUCIDE.arrowLeft} />
          </Link>
        </Button>
        <div className="min-w-0">
          <Typography variant="h4" as="h1" className="truncate">
            {t('history.title')}
          </Typography>
          <Typography variant="body-4" className="text-muted-foreground">
            {t('history.intro')}
          </Typography>
        </div>
      </header>

      {attempts.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : rows.length === 0 ? (
        <Typography variant="body-3" className="text-muted-foreground">
          {t('history.empty')}
        </Typography>
      ) : (
        <ul className="space-y-3">
          {rows.map((attempt) => (
            <HistoryItem
              key={attempt.id}
              attempt={attempt}
              title={titles.get(attempt.datasetId) ?? t('history.unknownSet')}
              date={df.date(attempt.finishedAt ?? attempt.startedAt)}
            />
          ))}
        </ul>
      )}
    </main>
  )
}

function HistoryItem({
  attempt,
  title,
  date,
}: {
  attempt: QaAttempt
  title: string
  date: string
}) {
  const t = useTranslations('web.learn')
  const open = attempt.status === 'in_progress'

  return (
    <li>
      <Link
        href={`/learn/attempts/${attempt.id}/review`}
        className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <div className="min-w-0 flex-1 space-y-1">
          <Typography variant="title-3" as="p" className="truncate">
            {title}
          </Typography>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Typography variant="body-4" className="text-muted-foreground">
              {date}
            </Typography>
            <Typography variant="body-4" className="text-muted-foreground">
              {t('history.score', {
                correct: attempt.correctCount,
                answered: attempt.answeredCount,
              })}
            </Typography>
            {open ? <Badge tone="info">{t('browse.inProgress')}</Badge> : null}
          </div>
        </div>
        <Icon
          icon={LUCIDE.chevronRight}
          className="shrink-0 text-muted-foreground"
        />
      </Link>
    </li>
  )
}
