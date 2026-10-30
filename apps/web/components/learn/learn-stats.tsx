'use client'

import {useTranslations} from 'next-intl'
import Link from 'next/link'
import {useMemo} from 'react'
import {useSearchParams} from 'next/navigation'
import {useBrowseQaDatasets, useQaDatasetQuestionStats} from '@noalhub/api/qa'
import {usePathname, useRouter} from '@noalhub/i18n/navigation'
import {useDateFormat} from '@noalhub/i18n/use-date-format'
import {Button} from '@noalhub/ui/button'
import {Icon, LUCIDE} from '@noalhub/ui/icons'
import {Select} from '@noalhub/ui/select'
import {Skeleton} from '@noalhub/ui/skeleton'
import {Toggle} from '@noalhub/ui/toggle'
import {Tooltip} from '@noalhub/ui/tooltip'
import {Typography} from '@noalhub/ui/typography'

import {QuestionStatsChart} from '@noalhub/ui/question-stats-chart'
import {ToastError} from '@noalhub/ui/toast'

/**
 * The statistics page: per question set, how often each question was answered
 * and how often it was answered right (`SetStats`).
 */
export function LearnStats() {
  const t = useTranslations('web.learn')

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          shape="circle"
          asChild
          className="-ml-2 shrink-0">
          <Link href="/learn" aria-label={t('attempt.backToBrowse')}>
            <Icon icon={LUCIDE.arrowLeft} />
          </Link>
        </Button>
        <Typography variant="h4" as="h1" className="min-w-0 flex-1 break-words">
          {t('stats.title')}
        </Typography>
      </div>

      <SetStats />
    </main>
  )
}

const PERIOD_ICONS = {
  day: LUCIDE.calendar1,
  week: LUCIDE.calendarDays,
  month: LUCIDE.calendarRange,
  all: LUCIDE.infinity,
} as const
const METRIC_ICONS = {count: LUCIDE.hash, percent: LUCIDE.percent} as const
const METRICS = ['count', 'percent'] as const
type Metric = (typeof METRICS)[number]
const PERIODS = ['day', 'week', 'month', 'all'] as const
type Period = (typeof PERIODS)[number]

function rawText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const {text, content} = node as {text?: string; content?: unknown[]}
  if (typeof text === 'string') return text
  return Array.isArray(content) ? content.map(rawText).join(' ') : ''
}

/** The plain text of a question, for a short preview: markdown images dropped. */
function docText(node: unknown): string {
  return rawText(node)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Local midnight `days - 1` days ago; `null` for "all time". */
function periodStart(period: Period): number | null {
  if (period === 'all') return null
  const days = period === 'day' ? 1 : period === 'week' ? 7 : 30
  const now = new Date()
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (days - 1),
  ).getTime()
}

/**
 * One question set at a time, one bar per question: the light bar is how often
 * you answered it in the chosen period, the solid part how often you got it
 * right. Hover (or tap / focus) a bar to read the question and its numbers.
 */
function SetStats() {
  const t = useTranslations('web.learn')
  const df = useDateFormat()
  const datasets = useBrowseQaDatasets()
  // The filters live in the URL (?set=&period=&metric=&answered=1), so a view can be
  // shared or bookmarked and survives a reload. Defaults are left out to keep it short.
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const picked = searchParams.get('set') ?? ''
  const periodParam = searchParams.get('period')
  const metricParam = searchParams.get('metric')
  const period = PERIODS.find((value) => value === periodParam) ?? 'all'
  const metric = METRICS.find((value) => value === metricParam) ?? 'count'
  const answeredOnly = searchParams.get('answered') === '1'
  const zoomParam = searchParams.get('zoom')
  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString())
    if (value === null) next.delete(key)
    else next.set(key, value)
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    })
  }
  const setPicked = (id: string) => setParam('set', id)
  const setPeriod = (value: Period) =>
    setParam('period', value === 'all' ? null : value)
  const setMetric = (value: Metric) =>
    setParam('metric', value === 'count' ? null : value)
  const setAnsweredOnly = (on: boolean) => setParam('answered', on ? '1' : null)
  const sets = datasets.data?.items ?? []
  const set = sets.find((row) => row.id === picked) ?? sets[0]
  const data = useQaDatasetQuestionStats(set?.id)

  const since = periodStart(period)
  const rows = useMemo(() => {
    const byItem = new Map<string, {answered: number; correct: number}>()
    for (const answer of data.answers) {
      if (since !== null && new Date(answer.answeredAt).getTime() < since)
        continue
      const row = byItem.get(answer.itemId) ?? {answered: 0, correct: 0}
      row.answered += 1
      if (answer.isCorrect) row.correct += 1
      byItem.set(answer.itemId, row)
    }
    return data.items.map((item, index) => ({
      item,
      number: index + 1,
      ...(byItem.get(item.id) ?? {answered: 0, correct: 0}),
    }))
  }, [data.items, data.answers, since])

  if (datasets.isPending) return <Skeleton className="mt-6 h-64 w-full" />
  if (!set) return null

  const shown = answeredOnly ? rows.filter((row) => row.answered > 0) : rows
  // Totals count every answer in the period, including ones to questions that have
  // since left the bank — those have no bar but they were still given.
  const inPeriod = data.answers.filter(
    (answer) =>
      since === null || new Date(answer.answeredAt).getTime() >= since,
  )
  const totalAnswers = inPeriod.length
  const totalCorrect = inPeriod.filter((answer) => answer.isCorrect).length

  return (
    <section className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography variant="title-3" as="h2">
          {t('stats.bySet.title')}
        </Typography>
        <div className="w-full sm:w-80">
          <Select
            label={t('stats.bySet.pick')}
            hideLabel
            value={set.id}
            onChange={(event) => setPicked(event.target.value)}
            options={sets.map((row) => ({value: row.id, label: row.title}))}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toggle
          variant="filter"
          value={period}
          onValueChange={setPeriod}
          aria-label={t('stats.bySet.periodLabel')}
          options={PERIODS.map((value) => ({
            value,
            icon: PERIOD_ICONS[value],
            label: t(`stats.bySet.periods.${value}`),
          }))}
        />
        <div className="flex items-center gap-2">
          <Toggle
            variant="filter"
            value={metric}
            onValueChange={setMetric}
            aria-label={t('stats.bySet.metricLabel')}
            options={METRICS.map((value) => ({
              value,
              icon: METRIC_ICONS[value],
              label: t(`stats.bySet.metrics.${value}`),
            }))}
          />
          {/* An icon chip rather than a bare switch (its off track is the card's own colour); the label is the tooltip. */}
          <Tooltip label={t('stats.bySet.answeredOnly')}>
            <button
              type="button"
              role="switch"
              aria-checked={answeredOnly}
              aria-label={t('stats.bySet.answeredOnly')}
              onClick={() => setAnsweredOnly(!answeredOnly)}
              className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                answeredOnly
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              }`}>
              <Icon
                icon={answeredOnly ? LUCIDE.check : LUCIDE.listFilter}
                className="size-3.5"
              />
            </button>
          </Tooltip>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {[
          [t('stats.bySet.questions'), set.itemCount],
          [t('stats.bySet.answers'), totalAnswers],
          [t('stats.bySet.correctOverall'), `${totalCorrect}/${totalAnswers}`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 space-y-1 rounded-lg border border-border bg-background/40 px-3 py-2.5">
            <dd className="text-title-2 tabular-nums text-foreground">
              {data.isPending ? '–' : value}
            </dd>
            <dt className="truncate text-body-4 text-muted-foreground">
              {label}
            </dt>
          </div>
        ))}
      </dl>
      {since === null ? null : (
        <Typography variant="body-4" className="text-muted-foreground">
          {t('stats.bySet.range', {
            from: df.date(new Date(since).toISOString()),
            to: df.date(new Date().toISOString()),
          })}
        </Typography>
      )}

      {data.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : data.isError ? (
        <ToastError message={t('stats.bySet.loadError')} />
      ) : shown.length === 0 ? (
        <Typography variant="body-3" className="text-muted-foreground">
          {t('stats.bySet.empty')}
        </Typography>
      ) : (
        <QuestionStatsChart
          rows={shown.map((row) => ({
            number: row.number,
            question: docText(row.item.question),
            answered: row.answered,
            correct: row.correct,
          }))}
          metric={metric}
          scope={`${set.id}-${period}-${answeredOnly}`}
          zoomParam={zoomParam}
          onZoomChange={(zoom) => setParam('zoom', zoom)}
          labels={{
            questionN: (n) => t('stats.bySet.questionN', {n}),
            never: t('stats.bySet.never'),
            times: (values) => t('stats.bySet.times', values),
            visibleRange: (values) => t('stats.bySet.visibleRange', values),
            zoomLabel: t('stats.bySet.zoomLabel'),
            zoomAll: t('stats.bySet.zoomAll'),
            legendAnswered: t('stats.bySet.legendAnswered'),
            legendCorrect: t('stats.bySet.legendCorrect'),
            navStart: t('stats.bySet.navStart'),
            navEnd: t('stats.bySet.navEnd'),
          }}
        />
      )}
    </section>
  )
}
