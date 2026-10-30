'use client'

import {useState} from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
} from 'recharts'

import {Icon, LUCIDE} from './icons'
import {RangeNavigator} from './range-navigator'
import {Typography} from './typography'

export type QuestionStatsRow = {
  number: number
  /** Plain text preview of the question. */
  question: string
  answered: number
  correct: number
}

export type QuestionStatsMetric = 'count' | 'percent'

/** Quick zoom presets (number of questions in view); `null` is "everything". */
const ZOOMS = [25, 50, 100, null] as const
type Zoom = (typeof ZOOMS)[number]
/** Below this many questions there is nothing to zoom or navigate, so those controls are hidden. */
const MIN_NAVIGABLE = 25
const CHART_HEIGHT = 280
// Semantic tokens flip with light/dark on their own; `var(...)` works in SVG attributes.
const AXIS = {fill: 'var(--muted-foreground)', fontSize: 11} as const
const GRID = 'var(--border)'
/** Bars are rounded at the head and flat at the foot, so they stand on the axis. */
const ROUND_TOP: [number, number, number, number] = [6, 6, 0, 0]

/**
 * The zoom a view opens with: the one asked for if there is one, otherwise
 * everything for a small set and the last 100 for a larger one.
 */
function openingZoom(param: string | null | undefined, total: number): Zoom {
  if (param === 'all') return null
  const wanted = ZOOMS.find((size) => size !== null && String(size) === param)
  if (wanted !== undefined) return wanted
  return total > 100 ? 100 : null
}

/** The window of `size` questions ending at the last one — the newest, where the learner is most likely working. */
function tailWindow(total: number, size: Zoom) {
  const span = size === null ? total : Math.min(size, total)
  return {start: total - span, end: Math.max(total - 1, 0)}
}

export type QuestionStatsChartLabels = {
  questionN: (n: number) => string
  never: string
  times: (values: {answered: number; correct: number; rate: number}) => string
  visibleRange: (values: {from: number; to: number}) => string
  zoomLabel: string
  zoomAll: string
  legendAnswered: string
  legendCorrect: string
  navStart: string
  navEnd: string
}

/**
 * One bar per question: the light bar is how often it was answered, the solid
 * part how often it was answered right. Hover (or tap / focus) a bar to read
 * the question and its numbers. Shared by the learner's own statistics (web)
 * and the everyone-combined overview (admin).
 *
 * `scope` identifies the data's shape (another set, period, filter): the
 * visible window resets whenever it changes. Labels come in as props so the
 * component pins no app's i18n namespace.
 */
export function QuestionStatsChart({
  rows,
  metric,
  scope,
  zoomParam,
  onZoomChange,
  labels,
}: {
  rows: QuestionStatsRow[]
  metric: QuestionStatsMetric
  scope: string
  /** The zoom to open with (e.g. from the URL): `"25" | "50" | "100" | "all"`. */
  zoomParam?: string | null
  onZoomChange?: (zoom: string) => void
  labels: QuestionStatsChartLabels
}) {
  const [view, setView] = useState({scope: '', start: 0, end: 0})
  const percent = metric === 'percent'
  const data = rows.map((row) => ({
    ...row,
    wrong: row.answered - row.correct,
    rate: row.answered > 0 ? Math.round((row.correct / row.answered) * 100) : 0,
  }))

  const last = Math.max(data.length - 1, 0)
  const cur =
    view.scope === scope
      ? view
      : {scope, ...tailWindow(data.length, openingZoom(zoomParam, data.length))}
  const start = Math.min(cur.start, last)
  const end = Math.min(Math.max(cur.end, start), last)
  const zoomTo = (size: Zoom) => {
    onZoomChange?.(size === null ? 'all' : String(size))
    const span = size === null ? data.length : Math.min(size, data.length)
    const from = Math.min(start, Math.max(data.length - span, 0))
    setView({scope, start: from, end: from + span - 1})
  }
  const zoomed = end - start + 1

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Typography variant="title-4" as="span" className="tabular-nums">
          {labels.visibleRange({
            from: data[start]?.number ?? 0,
            to: data[end]?.number ?? 0,
          })}
        </Typography>
        {data.length > MIN_NAVIGABLE ? (
          <div
            role="group"
            aria-label={labels.zoomLabel}
            className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5">
            <Icon
              icon={LUCIDE.zoomIn}
              className="mx-1.5 size-3.5 text-muted-foreground"
            />
            {ZOOMS.filter((size) => size === null || size < data.length).map(
              (size) => {
                const active =
                  size === null ? zoomed >= data.length : zoomed === size
                return (
                  <button
                    key={size ?? 'all'}
                    type="button"
                    aria-pressed={active}
                    onClick={() => zoomTo(size)}
                    className={`h-6 min-w-9 cursor-pointer rounded-md px-2 text-body-4 font-medium tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}>
                    {size ?? labels.zoomAll}
                  </button>
                )
              },
            )}
          </div>
        ) : null}
      </div>

      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart
          data={data.slice(start, end + 1)}
          margin={{top: 8, right: 8, bottom: 0, left: 0}}
          barCategoryGap="18%">
          <defs>
            {/* Solid-to-soft fade, like a progress fill: reads as "how full" at a glance. */}
            <linearGradient id="question-stats-bar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={1} />
              <stop
                offset="100%"
                stopColor="var(--primary)"
                stopOpacity={0.55}
              />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 4" />
          <XAxis
            dataKey="number"
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            minTickGap={16}
          />
          <YAxis
            allowDecimals={false}
            tick={AXIS}
            width={percent ? 40 : 28}
            tickLine={false}
            axisLine={false}
            domain={percent ? [0, 100] : [0, 'auto']}
            ticks={percent ? [0, 25, 50, 75, 100] : undefined}
            tickFormatter={percent ? (value: number) => `${value}%` : undefined}
          />
          <ChartTooltip
            cursor={{fill: 'var(--foreground)', fillOpacity: 0.06, radius: 6}}
            isAnimationActive={false}
            content={({active, payload}) => {
              const row = active ? payload?.[0]?.payload : null
              if (!row) return null
              return (
                <div className="max-w-xs space-y-1 rounded-lg border border-border bg-surface p-3 shadow-lg">
                  <Typography
                    variant="body-4"
                    className="text-muted-foreground">
                    {labels.questionN(row.number)} ·{' '}
                    {row.answered === 0
                      ? labels.never
                      : labels.times({
                          answered: row.answered,
                          correct: row.correct,
                          rate: row.rate,
                        })}
                  </Typography>
                  <Typography variant="body-3" className="line-clamp-4">
                    {row.question}
                  </Typography>
                </div>
              )
            }}
          />
          {percent ? (
            <Bar
              dataKey="rate"
              fill="url(#question-stats-bar)"
              radius={ROUND_TOP}
              isAnimationActive={false}
            />
          ) : (
            <>
              <Bar
                dataKey="correct"
                stackId="a"
                fill="url(#question-stats-bar)"
                // Only the topmost segment of a stack is rounded: this one when nothing wrong sits above it.
                shape={(props: BarShapeProps) => (
                  <Rectangle
                    {...props}
                    radius={props.payload?.wrong === 0 ? ROUND_TOP : 0}
                  />
                )}
                isAnimationActive={false}
              />
              <Bar
                dataKey="wrong"
                stackId="a"
                // color-mix rather than `fillOpacity`, so the legend swatch matches.
                fill="color-mix(in srgb, var(--foreground) 28%, transparent)"
                radius={ROUND_TOP}
                isAnimationActive={false}
              />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>

      {data.length > MIN_NAVIGABLE ? (
        <RangeNavigator
          values={data.map((row) => (percent ? row.rate : row.answered))}
          start={start}
          end={end}
          onChange={(from, to) => setView({scope, start: from, end: to})}
          startLabel={labels.navStart}
          endLabel={labels.navEnd}
        />
      ) : null}

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-body-4 text-muted-foreground">
        {percent ? null : (
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-foreground/20" aria-hidden />
            {labels.legendAnswered}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-primary" aria-hidden />
          {labels.legendCorrect}
        </span>
      </div>
    </div>
  )
}
