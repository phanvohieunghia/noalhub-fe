import { Skeleton } from "@noalhub/ui/skeleton";
import { Typography } from "@noalhub/ui/typography";

export type ProportionSegment = {
  label: string;
  value: number;
  /** Fill of this segment's slice of the bar and its legend dot. */
  tone: "primary" | "muted";
};

const TONES = {
  primary: "bg-primary",
  muted: "bg-muted-foreground/30",
} as const;

/**
 * A card that splits one total into two parts: a headline percentage for the
 * first segment, a bar, and a legend with the raw counts.
 *
 * The bar is `role="img"` with a text label rather than a bare `div` pair — the
 * legend already carries the numbers, so a screen reader gets one sentence
 * instead of two meaningless empty boxes.
 */
export function ProportionCard({
  title,
  segments,
  summary,
  isLoading = false,
}: {
  title: string;
  segments: [ProportionSegment, ProportionSegment];
  /** Accessible description of the bar, e.g. "12 of 40 verified". */
  summary: string;
  isLoading?: boolean;
}) {
  const total = segments[0].value + segments[1].value;
  const percent = total === 0 ? 0 : Math.round((segments[0].value / total) * 100);

  return (
    <div className="border-border rounded-xl border p-6">
      <Typography variant="title-4" weight={500} className="text-muted-foreground uppercase tracking-wide">
        {title}
      </Typography>

      {isLoading ? (
        <>
          <Skeleton className="mt-2 h-10 w-24" />
          <Skeleton className="mt-4 h-2 w-full" />
        </>
      ) : (
        <>
          <Typography variant="h1" as="p" className="mt-2 tabular-nums">
            {percent}%
          </Typography>
          <div
            role="img"
            aria-label={summary}
            className="bg-muted mt-4 flex h-2 w-full overflow-hidden rounded-full"
          >
            <div className={`${TONES[segments[0].tone]} h-full`} style={{ width: `${percent}%` }} />
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {segments.map((segment) => (
              <li key={segment.label} className="flex items-center gap-2">
                <span aria-hidden className={`${TONES[segment.tone]} size-2 rounded-full`} />
                <Typography variant="body-3" as="span" className="text-muted-foreground">
                  {segment.label}
                </Typography>
                <Typography variant="body-3" as="span" weight={500} className="tabular-nums">
                  {segment.value.toLocaleString("vi-VN")}
                </Typography>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
