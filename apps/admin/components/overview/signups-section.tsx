"use client";

import { useState } from "react";

import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Alert } from "@noalhub/ui/alert";
import { Badge } from "@noalhub/ui/badge";
import { Typography } from "@noalhub/ui/typography";

import { RangeTabs } from "./range-tabs";
import { SIGNUP_RANGES, type SignupRange } from "./signup-series";
import { useSampleSignupSeries } from "./use-signup-series";

// Charts are the one place theme scale tokens are fine (`docs/theme.md`), but
// semantic tokens are used anyway: they already flip with light/dark, so no
// per-theme colour table is needed here. `var(...)` works in SVG presentation
// attributes, which is how Recharts passes these through.
const AXIS = { fill: "var(--muted-foreground)", fontSize: 12 } as const;
const GRID = "var(--border)";
const TOOLTIP_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
} as const;

const CHART_HEIGHT = 280;

/**
 * New-user charts with a week / month / year filter.
 *
 * ⚠️ Runs on **sample data** for now (`useSampleSignupSeries`): the backend has
 * no time-series endpoint (`docs/admin-plan.md` §2b), so the numbers are
 * invented and the page says so in a visible notice. Remove the notice together
 * with the hook swap — never one without the other.
 */
export function SignupsSection() {
  const t = useTranslations("admin.overview");
  const df = useDateFormat();
  const [range, setRange] = useState<SignupRange>("month");
  const series = useSampleSignupSeries(range).data;

  const monthly = series.granularity === "month";
  const tick = (value: string) => (monthly ? df.monthYear(value) : df.dayMonth(value));
  const tooltipLabel = (value: unknown) =>
    monthly ? df.monthYear(String(value)) : df.date(String(value));

  const data = series.points.map((point) => ({
    date: point.date,
    newUsers: point.newUsers,
    verified: point.verifiedNewUsers,
    unverified: Math.max(point.newUsers - point.verifiedNewUsers, 0),
  }));

  const change =
    series.previousTotal === 0
      ? null
      : Math.round(((series.total - series.previousTotal) / series.previousTotal) * 100);

  return (
    <section aria-labelledby="signups-title" className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Typography variant="h5" as="h2" id="signups-title">
            {t("signups.title")}
          </Typography>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Typography variant="body-3" as="span" className="text-muted-foreground">
              {t("signups.total", { count: series.total })}
            </Typography>
            {change === null ? null : (
              <Badge tone={change > 0 ? "success" : change < 0 ? "danger" : "neutral"}>
                {t("signups.change", { percent: `${change > 0 ? "+" : ""}${change}%` })}
              </Badge>
            )}
          </div>
        </div>
        <RangeTabs
          value={range}
          onChange={setRange}
          label={t("signups.rangeLabel")}
          options={SIGNUP_RANGES.map((value) => ({ value, label: t(`signups.ranges.${value}`) }))}
        />
      </div>

      <div className="mt-4">
        <Alert tone="warning" message={t("signups.sampleNotice")} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ChartCard title={t("signups.newUsersTitle")} summary={t("signups.newUsersSummary")}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="date" tickFormatter={tick} tick={AXIS} minTickGap={24} stroke={GRID} />
              <YAxis allowDecimals={false} tick={AXIS} width={36} stroke={GRID} />
              <Tooltip labelFormatter={tooltipLabel} contentStyle={TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="newUsers"
                name={t("signups.newUsersTitle")}
                stroke="var(--primary)"
                strokeWidth={2}
                fill="var(--primary)"
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("signups.statusTitle")} summary={t("signups.statusSummary")}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="date" tickFormatter={tick} tick={AXIS} minTickGap={24} stroke={GRID} />
              <YAxis allowDecimals={false} tick={AXIS} width={36} stroke={GRID} />
              <Tooltip
                labelFormatter={tooltipLabel}
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: "var(--muted)" }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
              <Bar dataKey="verified" name={t("verified")} stackId="status" fill="var(--primary)" />
              <Bar
                dataKey="unverified"
                name={t("unverified")}
                stackId="status"
                fill="var(--muted-foreground)"
                fillOpacity={0.35}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}

/**
 * `role="img"` + a text label rather than leaving the SVG to a screen reader:
 * hundreds of unnamed rects and paths are noise. The numbers are still
 * reachable through the tooltip for sighted keyboard-less users, and the
 * summary line states what the picture shows.
 */
function ChartCard({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border rounded-xl border p-6">
      <Typography variant="title-4" weight={500} className="text-muted-foreground uppercase tracking-wide">
        {title}
      </Typography>
      <div role="img" aria-label={summary} className="mt-4">
        {children}
      </div>
    </div>
  );
}
