'use client'

import {useState} from 'react'

import {
  ADMIN_QA_PERIODS,
  useAdminQaQuestionStats,
  type AdminQaPeriod,
} from '@noalhub/api/admin'
import {useQaDatasets} from '@noalhub/api/qa'
import {useDateFormat} from '@noalhub/i18n/use-date-format'
import {useTranslations} from 'next-intl'
import {AlertError} from '@noalhub/ui/alert'
import {Icon, LUCIDE} from '@noalhub/ui/icons'
import {QuestionStatsChart} from '@noalhub/ui/question-stats-chart'
import {Select} from '@noalhub/ui/select'
import {Skeleton} from '@noalhub/ui/skeleton'
import {Toggle} from '@noalhub/ui/toggle'
import {Tooltip} from '@noalhub/ui/tooltip'
import {Typography} from '@noalhub/ui/typography'

const PERIOD_ICONS = {
  day: LUCIDE.calendar1,
  week: LUCIDE.calendarDays,
  month: LUCIDE.calendarRange,
  all: LUCIDE.infinity,
} as const
const METRICS = ['count', 'percent'] as const
type Metric = (typeof METRICS)[number]
const METRIC_ICONS = {count: LUCIDE.hash, percent: LUCIDE.percent} as const

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

/** Local midnight of the first day of the period, to caption the numbers; `null` for "all time". */
function periodStart(period: AdminQaPeriod): Date | null {
  if (period === 'all') return null
  const days = period === 'day' ? 1 : period === 'week' ? 7 : 30
  const now = new Date()
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - (days - 1),
    ),
  )
}

/**
 * The learner's "by question set" statistics (`apps/web` → `LearnStats`), summed
 * over every user (or one, with `userId` — the user detail page): one dataset at a time, one bar per question, from
 * `GET /admin/stats/qa-questions`. The chart itself is the shared
 * `QuestionStatsChart`.
 */
export function QaAnswersSection({userId}: {userId?: string} = {}) {
  const t = useTranslations('admin.overview.qaAnswers')
  const df = useDateFormat()
  const datasets = useQaDatasets()
  const [picked, setPicked] = useState('')
  const [period, setPeriod] = useState<AdminQaPeriod>('all')
  const [metric, setMetric] = useState<Metric>('count')
  const [answeredOnly, setAnsweredOnly] = useState(false)

  const sets = datasets.data ?? []
  const set = sets.find((row) => row.id === picked) ?? sets[0]
  const stats = useAdminQaQuestionStats(set?.id, period, userId)

  const heading = (
    <Typography variant="title-3" as="h2" id="qa-answers-title">
      {t(userId ? 'titleUser' : 'title')}
    </Typography>
  )

  if (datasets.isPending) {
    return (
      <section
        aria-labelledby="qa-answers-title"
        className="border-border bg-surface mt-4 rounded-xl border p-5">
        {heading}
        <Skeleton className="mt-4 h-64 w-full" />
      </section>
    )
  }
  if (!set) {
    return (
      <section
        aria-labelledby="qa-answers-title"
        className="border-border bg-surface mt-4 rounded-xl border p-5">
        {heading}
        <Typography variant="body-3" className="text-muted-foreground mt-2">
          {t('noDatasets')}
        </Typography>
      </section>
    )
  }

  const data = stats.data
  const rows = (data?.items ?? []).map((item, index) => ({
    number: index + 1,
    question: docText(item.question),
    answered: item.answered,
    correct: item.correct,
  }))
  const shown = answeredOnly ? rows.filter((row) => row.answered > 0) : rows
  const since = periodStart(period)
  const summary = [
    [t('questions'), data?.items.length],
    [t('answers'), data?.totalAnswers],
    [
      t('correctOverall'),
      data ? `${data.totalCorrect}/${data.totalAnswers}` : undefined,
    ],
  ] as const

  return (
    <section
      aria-labelledby="qa-answers-title"
      className="border-border bg-surface mt-4 space-y-4 rounded-xl border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {heading}
        <div className="w-full sm:w-80">
          <Select
            label={t('pick')}
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
          aria-label={t('periodLabel')}
          options={ADMIN_QA_PERIODS.map((value) => ({
            value,
            icon: PERIOD_ICONS[value],
            label: t(`periods.${value}`),
          }))}
        />
        <div className="flex items-center gap-2">
          <Toggle
            variant="filter"
            value={metric}
            onValueChange={setMetric}
            aria-label={t('metricLabel')}
            options={METRICS.map((value) => ({
              value,
              icon: METRIC_ICONS[value],
              label: t(`metrics.${value}`),
            }))}
          />
          <Tooltip label={t('answeredOnly')}>
            <button
              type="button"
              role="switch"
              aria-checked={answeredOnly}
              aria-label={t('answeredOnly')}
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
        {summary.map(([label, value]) => (
          <div
            key={label}
            className="border-border bg-background/40 min-w-0 space-y-1 rounded-lg border px-3 py-2.5">
            <dd className="text-title-2 text-foreground tabular-nums">
              {value ?? '–'}
            </dd>
            <dt className="text-body-4 text-muted-foreground truncate">
              {label}
            </dt>
          </div>
        ))}
      </dl>
      {since === null ? null : (
        <Typography variant="body-4" className="text-muted-foreground">
          {t('range', {
            from: df.date(since.toISOString()),
            to: df.date(new Date().toISOString()),
          })}
        </Typography>
      )}

      {stats.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : stats.isError ? (
        <AlertError message={t('loadError')} />
      ) : shown.length === 0 ? (
        <Typography variant="body-3" className="text-muted-foreground">
          {t(userId ? 'emptyUser' : 'empty')}
        </Typography>
      ) : (
        <QuestionStatsChart
          rows={shown}
          metric={metric}
          scope={`${set.id}-${period}-${answeredOnly}-${userId ?? ''}`}
          labels={{
            questionN: (n) => t('questionN', {n}),
            never: t(userId ? 'neverUser' : 'never'),
            times: (values) => t('times', values),
            visibleRange: (values) => t('visibleRange', values),
            zoomLabel: t('zoomLabel'),
            zoomAll: t('zoomAll'),
            legendAnswered: t('legendAnswered'),
            legendCorrect: t('legendCorrect'),
            navStart: t('navStart'),
            navEnd: t('navEnd'),
          }}
        />
      )}
    </section>
  )
}
