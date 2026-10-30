'use client'

import {useState} from 'react'

import {
  ADMIN_SIGNUP_RANGES,
  useAdminSignups,
  type AdminSignupRange,
} from '@noalhub/api/admin'
import {useDateFormat} from '@noalhub/i18n/use-date-format'
import {useTranslations} from 'next-intl'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {Badge} from '@noalhub/ui/badge'
import {LUCIDE} from '@noalhub/ui/icons'
import {Skeleton} from '@noalhub/ui/skeleton'
import {Toggle} from '@noalhub/ui/toggle'
import {Typography} from '@noalhub/ui/typography'

import {AdminErrorState} from '../admin-error-state'

// Charts are the one place theme scale tokens are fine (`docs/theme.md`), but
// semantic tokens are used anyway: they already flip with light/dark, so no
// per-theme colour table is needed here. `var(...)` works in SVG presentation
// attributes, which is how Recharts passes these through.
const AXIS = {fill: 'var(--muted-foreground)', fontSize: 11} as const
const GRID = 'var(--border)'
const ROUND_TOP: [number, number, number, number] = [6, 6, 0, 0]
const TOOLTIP_STYLE = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--foreground)',
  boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
  fontSize: 12,
} as const

const RANGE_ICONS = {
  week: LUCIDE.calendarDays,
  month: LUCIDE.calendarRange,
  year: LUCIDE.calendar,
} as const

const CHART_HEIGHT = 200

/**
 * New-user charts with a week / month / year filter, from
 * `GET /admin/stats/signups` (UTC buckets, rolling windows — see the DTO).
 */
export function SignupsSection() {
  const t = useTranslations('admin.overview')
  const df = useDateFormat()
  const [range, setRange] = useState<AdminSignupRange>('month')
  const signups = useAdminSignups(range)
  const series = signups.data

  if (signups.isError && !series) {
    return (
      <section
        aria-labelledby="signups-title"
        className="border-border bg-surface mt-4 rounded-xl border p-5">
        <Typography variant="title-3" as="h2" id="signups-title">
          {t('signups.title')}
        </Typography>
        <div className="mt-4">
          <AdminErrorState
            error={signups.error}
            onRetry={() => signups.refetch()}
          />
        </div>
      </section>
    )
  }
  if (!series) {
    return (
      <section
        aria-labelledby="signups-title"
        className="border-border bg-surface mt-4 rounded-xl border p-5">
        <Typography variant="title-3" as="h2" id="signups-title">
          {t('signups.title')}
        </Typography>
        <Skeleton className="mt-4 h-80 w-full" />
      </section>
    )
  }

  const monthly = series.granularity === 'month'
  const tick = (value: string) =>
    monthly ? df.monthYear(value) : df.dayMonth(value)
  const tooltipLabel = (value: unknown) =>
    monthly ? df.monthYear(String(value)) : df.date(String(value))

  const data = series.points.map((point) => ({
    date: point.date,
    newUsers: point.newUsers,
    verified: point.verifiedNewUsers,
    unverified: Math.max(point.newUsers - point.verifiedNewUsers, 0),
  }))

  const change =
    series.previousTotal === 0
      ? null
      : Math.round(
          ((series.total - series.previousTotal) / series.previousTotal) * 100,
        )

  return (
    <section
      aria-labelledby="signups-title"
      className="border-border bg-surface mt-4 space-y-4 rounded-xl border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography variant="title-3" as="h2" id="signups-title">
            {t('signups.title')}
          </Typography>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Typography
              variant="body-3"
              as="span"
              className="text-muted-foreground">
              {t('signups.total', {count: series.total})}
            </Typography>
            {change === null ? null : (
              <Badge
                tone={
                  change > 0 ? 'success' : change < 0 ? 'danger' : 'neutral'
                }>
                {t('signups.change', {
                  percent: `${change > 0 ? '+' : ''}${change}%`,
                })}
              </Badge>
            )}
          </div>
        </div>
        <Toggle
          variant="filter"
          value={range}
          onValueChange={setRange}
          aria-label={t('signups.rangeLabel')}
          options={ADMIN_SIGNUP_RANGES.map((value) => ({
            value,
            icon: RANGE_ICONS[value],
            label: t(`signups.ranges.${value}`),
          }))}
        />
      </div>

      <div
        role="img"
        aria-label={t('signups.statusSummary')}
        className="border-border bg-background/40 rounded-lg border p-3">
        <div className="text-body-4 text-muted-foreground mb-2 flex flex-wrap justify-end gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="bg-primary size-3 rounded-sm" aria-hidden />
            {t('verified')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-foreground/20 size-3 rounded-sm" aria-hidden />
            {t('unverified')}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart
            data={data}
            margin={{top: 4, right: 4, bottom: 0, left: 0}}
            barCategoryGap="22%">
            <CartesianGrid
              vertical={false}
              stroke={GRID}
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="date"
              tickFormatter={tick}
              tick={AXIS}
              minTickGap={24}
              tickLine={false}
              axisLine={false}
              tickMargin={6}
            />
            <YAxis
              allowDecimals={false}
              tick={AXIS}
              width={28}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              labelFormatter={tooltipLabel}
              contentStyle={TOOLTIP_STYLE}
              cursor={{fill: 'var(--foreground)', fillOpacity: 0.06, radius: 6}}
            />
            <Bar
              dataKey="verified"
              name={t('verified')}
              stackId="status"
              fill="var(--primary)"
            />
            <Bar
              dataKey="unverified"
              name={t('unverified')}
              stackId="status"
              // color-mix rather than `fillOpacity`, so the legend swatch matches the bars.
              fill="color-mix(in srgb, var(--foreground) 28%, transparent)"
              radius={ROUND_TOP}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
