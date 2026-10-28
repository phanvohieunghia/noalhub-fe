"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  Rectangle,
  type BarShapeProps,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  useBrowseQaDatasets,
  useQaDatasetQuestionStats,
} from "@noalhub/api/qa";
import { usePathname, useRouter } from "@noalhub/i18n/navigation";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { Button } from "@noalhub/ui/button";
import { Icon, LUCIDE } from "@noalhub/ui/icons";
import { AlertError } from "@noalhub/ui/alert";
import { Select } from "@noalhub/ui/select";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Toggle } from "@noalhub/ui/toggle";
import { Tooltip } from "@noalhub/ui/tooltip";
import { Typography } from "@noalhub/ui/typography";

import { RangeNavigator } from "./range-navigator";

/**
 * The statistics page: per question set, how often each question was answered
 * and how often it was answered right (`SetStats`).
 */
export function LearnStats() {
  const t = useTranslations("web.learn");

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          shape="circle"
          asChild
          className="-ml-2 shrink-0"
        >
          <Link href="/learn" aria-label={t("attempt.backToBrowse")}>
            <Icon icon={LUCIDE.arrowLeft} />
          </Link>
        </Button>
        <Typography variant="h4" as="h1" className="min-w-0 flex-1 break-words">
          {t("stats.title")}
        </Typography>
      </div>

      <SetStats />
    </main>
  );
}

const PERIOD_ICONS = {
  day: LUCIDE.calendar1,
  week: LUCIDE.calendarDays,
  month: LUCIDE.calendarRange,
  all: LUCIDE.infinity,
} as const;
const METRIC_ICONS = { count: LUCIDE.hash, percent: LUCIDE.percent } as const;
const METRICS = ["count", "percent"] as const;
type Metric = (typeof METRICS)[number];
// Semantic tokens flip with light/dark on their own; `var(...)` works in SVG attributes.
const AXIS = { fill: "var(--muted-foreground)", fontSize: 11 } as const;
const GRID = "var(--border)";
/** Bars are rounded at the head and flat at the foot, so they stand on the axis. */
const ROUND_TOP: [number, number, number, number] = [6, 6, 0, 0];
const CHART_HEIGHT = 280;
/** Quick zoom presets (number of questions in view); `null` is "everything". */
const ZOOMS = [25, 50, 100, null] as const;
type Zoom = (typeof ZOOMS)[number];

/**
 * The zoom a view opens with: the one in the URL if there is one, otherwise
 * everything for a small set and the last 100 for a larger one.
 */
function openingZoom(param: string | null, total: number): Zoom {
  if (param === "all") return null;
  const wanted = ZOOMS.find((size) => size !== null && String(size) === param);
  if (wanted !== undefined) return wanted;
  return total > 100 ? 100 : null;
}

/** The window of `size` questions ending at the last one — the newest, where the learner is most likely working. */
function tailWindow(total: number, size: Zoom) {
  const span = size === null ? total : Math.min(size, total);
  return { start: total - span, end: Math.max(total - 1, 0) };
}
/** Below this many questions there is nothing to zoom or navigate, so those controls are hidden. */
const MIN_NAVIGABLE = 25;
const PERIODS = ["day", "week", "month", "all"] as const;
type Period = (typeof PERIODS)[number];

function rawText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const { text, content } = node as { text?: string; content?: unknown[] };
  if (typeof text === "string") return text;
  return Array.isArray(content) ? content.map(rawText).join(" ") : "";
}

/** The plain text of a question, for a short preview: markdown images dropped. */
function docText(node: unknown): string {
  return rawText(node)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Local midnight `days - 1` days ago; `null` for "all time". */
function periodStart(period: Period): number | null {
  if (period === "all") return null;
  const days = period === "day" ? 1 : period === "week" ? 7 : 30;
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (days - 1),
  ).getTime();
}

/**
 * One question set at a time, one bar per question: the light bar is how often
 * you answered it in the chosen period, the solid part how often you got it
 * right. Hover (or tap / focus) a bar to read the question and its numbers.
 */
function SetStats() {
  const t = useTranslations("web.learn");
  const df = useDateFormat();
  const datasets = useBrowseQaDatasets();
  // The filters live in the URL (?set=&period=&metric=&answered=1), so a view can be
  // shared or bookmarked and survives a reload. Defaults are left out to keep it short.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const picked = searchParams.get("set") ?? "";
  const periodParam = searchParams.get("period");
  const metricParam = searchParams.get("metric");
  const period = PERIODS.find((value) => value === periodParam) ?? "all";
  const metric = METRICS.find((value) => value === metricParam) ?? "count";
  const answeredOnly = searchParams.get("answered") === "1";
  const zoomParam = searchParams.get("zoom");
  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };
  const setPicked = (id: string) => setParam("set", id);
  const setPeriod = (value: Period) =>
    setParam("period", value === "all" ? null : value);
  const setMetric = (value: Metric) =>
    setParam("metric", value === "count" ? null : value);
  const setAnsweredOnly = (on: boolean) =>
    setParam("answered", on ? "1" : null);
  const [view, setView] = useState({ scope: "", start: 0, end: 0 });
  const sets = datasets.data?.items ?? [];
  const set = sets.find((row) => row.id === picked) ?? sets[0];
  const data = useQaDatasetQuestionStats(set?.id);

  const since = periodStart(period);
  const rows = useMemo(() => {
    const byItem = new Map<string, { answered: number; correct: number }>();
    for (const answer of data.answers) {
      if (since !== null && new Date(answer.answeredAt).getTime() < since)
        continue;
      const row = byItem.get(answer.itemId) ?? { answered: 0, correct: 0 };
      row.answered += 1;
      if (answer.isCorrect) row.correct += 1;
      byItem.set(answer.itemId, row);
    }
    return data.items.map((item, index) => ({
      item,
      number: index + 1,
      ...(byItem.get(item.id) ?? { answered: 0, correct: 0 }),
    }));
  }, [data.items, data.answers, since]);

  if (datasets.isPending) return <Skeleton className="mt-6 h-64 w-full" />;
  if (!set) return null;

  const shown = answeredOnly ? rows.filter((row) => row.answered > 0) : rows;
  // Totals count every answer in the period, including ones to questions that have
  // since left the bank — those have no bar but they were still given.
  const inPeriod = data.answers.filter(
    (answer) =>
      since === null || new Date(answer.answeredAt).getTime() >= since,
  );
  const totalAnswers = inPeriod.length;
  const totalCorrect = inPeriod.filter((answer) => answer.isCorrect).length;
  const percent = metric === "percent";
  const rows_ = shown.map((row) => ({
    number: row.number,
    question: docText(row.item.question),
    answered: row.answered,
    correct: row.correct,
    wrong: row.answered - row.correct,
    rate: row.answered > 0 ? Math.round((row.correct / row.answered) * 100) : 0,
  }));
  const data_ = rows_;

  // The navigator window resets whenever the data's shape changes (another set, period or filter).
  const scope = `${set.id}-${period}-${answeredOnly}`;
  const last = Math.max(data_.length - 1, 0);
  const cur =
    view.scope === scope
      ? view
      : {
          scope,
          ...tailWindow(data_.length, openingZoom(zoomParam, data_.length)),
        };
  const start = Math.min(cur.start, last);
  const end = Math.min(Math.max(cur.end, start), last);
  const zoomTo = (size: Zoom) => {
    setParam("zoom", size === null ? "all" : String(size));
    const span = size === null ? data_.length : Math.min(size, data_.length);
    const from = Math.min(start, Math.max(data_.length - span, 0));
    setView({ scope, start: from, end: from + span - 1 });
  };
  const zoomed = end - start + 1;

  return (
    <section className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography variant="title-3" as="h2">
          {t("stats.bySet.title")}
        </Typography>
        <div className="w-full sm:w-80">
          <Select
            label={t("stats.bySet.pick")}
            hideLabel
            value={set.id}
            onChange={(event) => setPicked(event.target.value)}
            options={sets.map((row) => ({ value: row.id, label: row.title }))}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toggle
          variant="filter"
          value={period}
          onValueChange={setPeriod}
          aria-label={t("stats.bySet.periodLabel")}
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
            aria-label={t("stats.bySet.metricLabel")}
            options={METRICS.map((value) => ({
              value,
              icon: METRIC_ICONS[value],
              label: t(`stats.bySet.metrics.${value}`),
            }))}
          />
          {/* An icon chip rather than a bare switch (its off track is the card's own colour); the label is the tooltip. */}
          <Tooltip label={t("stats.bySet.answeredOnly")}>
            <button
              type="button"
              role="switch"
              aria-checked={answeredOnly}
              aria-label={t("stats.bySet.answeredOnly")}
              onClick={() => setAnsweredOnly(!answeredOnly)}
              className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                answeredOnly
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
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
          [t("stats.bySet.questions"), set.itemCount],
          [t("stats.bySet.answers"), totalAnswers],
          [t("stats.bySet.correctOverall"), `${totalCorrect}/${totalAnswers}`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 space-y-1 rounded-lg border border-border bg-background/40 px-3 py-2.5"
          >
            <dd className="text-title-2 tabular-nums text-foreground">
              {data.isPending ? "–" : value}
            </dd>
            <dt className="truncate text-body-4 text-muted-foreground">
              {label}
            </dt>
          </div>
        ))}
      </dl>
      {since === null ? null : (
        <Typography variant="body-4" className="text-muted-foreground">
          {t("stats.bySet.range", {
            from: df.date(new Date(since).toISOString()),
            to: df.date(new Date().toISOString()),
          })}
        </Typography>
      )}

      {data.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : data.isError ? (
        <AlertError message={t("stats.bySet.loadError")} />
      ) : shown.length === 0 ? (
        <Typography variant="body-3" className="text-muted-foreground">
          {t("stats.bySet.empty")}
        </Typography>
      ) : (
        <div className="space-y-3 rounded-lg border border-border bg-background/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <Typography variant="title-4" as="span" className="tabular-nums">
              {t("stats.bySet.visibleRange", {
                from: data_[start]?.number ?? 0,
                to: data_[end]?.number ?? 0,
              })}
            </Typography>
            {data_.length > MIN_NAVIGABLE ? (
              <div
                role="group"
                aria-label={t("stats.bySet.zoomLabel")}
                className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5"
              >
                <Icon
                  icon={LUCIDE.zoomIn}
                  className="mx-1.5 size-3.5 text-muted-foreground"
                />
                {ZOOMS.filter(
                  (size) => size === null || size < data_.length,
                ).map((size) => {
                  const active =
                    size === null ? zoomed >= data_.length : zoomed === size;
                  return (
                    <button
                      key={size ?? "all"}
                      type="button"
                      aria-pressed={active}
                      onClick={() => zoomTo(size)}
                      className={`h-6 min-w-9 cursor-pointer rounded-md px-2 text-body-4 font-medium tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {size ?? t("stats.bySet.zoomAll")}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart
              data={data_.slice(start, end + 1)}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              barCategoryGap="18%"
            >
              <defs>
                {/* Solid-to-soft fade, like a progress fill: reads as "how full" at a glance. */}
                <linearGradient id="learn-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--primary)"
                    stopOpacity={1}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--primary)"
                    stopOpacity={0.55}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke={GRID}
                strokeDasharray="3 4"
              />
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
                domain={percent ? [0, 100] : [0, "auto"]}
                ticks={percent ? [0, 25, 50, 75, 100] : undefined}
                tickFormatter={
                  percent ? (value: number) => `${value}%` : undefined
                }
              />
              <ChartTooltip
                cursor={{
                  fill: "var(--foreground)",
                  fillOpacity: 0.06,
                  radius: 6,
                }}
                isAnimationActive={false}
                content={({ active, payload }) => {
                  const row = active ? payload?.[0]?.payload : null;
                  if (!row) return null;
                  return (
                    <div className="max-w-xs space-y-1 rounded-lg border border-border bg-surface p-3 shadow-lg">
                      <Typography
                        variant="body-4"
                        className="text-muted-foreground"
                      >
                        {t("stats.bySet.questionN", { n: row.number })} ·{" "}
                        {row.answered === 0
                          ? t("stats.bySet.never")
                          : t("stats.bySet.times", {
                              answered: row.answered,
                              correct: row.correct,
                              rate: row.rate,
                            })}
                      </Typography>
                      <Typography variant="body-3" className="line-clamp-4">
                        {row.question}
                      </Typography>
                    </div>
                  );
                }}
              />
              {percent ? (
                <Bar
                  dataKey="rate"
                  fill="url(#learn-bar)"
                  radius={ROUND_TOP}
                  isAnimationActive={false}
                />
              ) : (
                <>
                  <Bar
                    dataKey="correct"
                    stackId="a"
                    fill="url(#learn-bar)"
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

          {data_.length > MIN_NAVIGABLE ? (
            <RangeNavigator
              values={data_.map((row) => (percent ? row.rate : row.answered))}
              start={start}
              end={end}
              onChange={(from, to) => setView({ scope, start: from, end: to })}
              startLabel={t("stats.bySet.navStart")}
              endLabel={t("stats.bySet.navEnd")}
            />
          ) : null}

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-body-4 text-muted-foreground">
            {percent ? null : (
              <span className="flex items-center gap-1.5">
                <span
                  className="size-3 rounded-sm bg-foreground/20"
                  aria-hidden
                />
                {t("stats.bySet.legendAnswered")}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-primary" aria-hidden />
              {t("stats.bySet.legendCorrect")}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
