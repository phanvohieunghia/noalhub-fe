import { Skeleton } from "@noalhub/ui/skeleton";
import { Typography } from "@noalhub/ui/typography";

export type ProportionSegment = {
  label: string;
  value: number;
  /** Colour of this segment's arc and its legend dot. */
  tone: "primary" | "muted";
};

const STROKES = {
  primary: "stroke-primary",
  muted: "stroke-foreground/15",
} as const;

const DOTS = {
  primary: "bg-primary",
  muted: "bg-foreground/20",
} as const;

// A circle of radius R with its circumference as the dash unit: a segment of
// `p` percent is just `p` of 100 dashes, so no arc maths is needed.
const SIZE = 120;
const STROKE_WIDTH = 14;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A donut chart that splits one total into two parts: the first segment's share
 * in the centre, a legend with the raw counts beside it.
 *
 * Drawn as SVG circles by hand — a chart library for two rings would be the
 * heaviest dependency in the app. The ring is `role="img"` with a text label
 * rather than bare shapes; the legend already carries the numbers, so a screen
 * reader gets one sentence instead of two meaningless arcs.
 */
export function ProportionCard({
  title,
  segments,
  summary,
  isLoading = false,
}: {
  title: string;
  segments: [ProportionSegment, ProportionSegment];
  /** Accessible description of the chart, e.g. "12 of 40 verified". */
  summary: string;
  isLoading?: boolean;
}) {
  const total = segments[0].value + segments[1].value;
  const percent = total === 0 ? 0 : Math.round((segments[0].value / total) * 100);
  const firstLength = total === 0 ? 0 : (segments[0].value / total) * CIRCUMFERENCE;

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <Typography variant="title-4" weight={500} className="text-muted-foreground uppercase tracking-wide">
        {title}
      </Typography>

      {isLoading ? (
        <div className="mt-4 flex items-center gap-6">
          <Skeleton className="size-30 shrink-0 rounded-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <div className="relative size-30 shrink-0">
            <svg
              role="img"
              aria-label={summary}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="size-full -rotate-90"
            >
              {/* The rest of the ring, drawn full-circle underneath. */}
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                strokeWidth={STROKE_WIDTH}
                className={STROKES[segments[1].tone]}
              />
              {firstLength > 0 ? (
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  strokeWidth={STROKE_WIDTH}
                  strokeDasharray={`${firstLength} ${CIRCUMFERENCE}`}
                  strokeLinecap="round"
                  className={STROKES[segments[0].tone]}
                />
              ) : null}
            </svg>
            <Typography
              variant="h4"
              as="p"
              className="absolute inset-0 flex items-center justify-center tabular-nums"
            >
              {percent}%
            </Typography>
          </div>

          <ul className="flex min-w-0 flex-1 flex-col gap-2">
            {segments.map((segment) => (
              <li key={segment.label} className="flex items-center gap-2">
                <span aria-hidden className={`${DOTS[segment.tone]} size-2 shrink-0 rounded-full`} />
                <Typography variant="body-3" as="span" className="text-muted-foreground">
                  {segment.label}
                </Typography>
                <Typography variant="body-3" as="span" weight={500} className="ml-auto tabular-nums">
                  {segment.value.toLocaleString("vi-VN")}
                </Typography>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
