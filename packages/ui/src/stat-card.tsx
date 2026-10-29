import { Icon, type IconName } from "./icons";
import { Skeleton } from "./skeleton";
import { Typography } from "./typography";

/**
 * A stat tile for the overview page.
 *
 * `hint` is where the number's meaning — and what it does **not** mean — is
 * spelled out; a count without a definition is the classic source of
 * misreading (e.g. "last 7 days" measured in server time, not the viewer's
 * timezone). `icon` is decoration only (it sits in a tinted chip), so it needs
 * no label.
 *
 * `compact` is the dense variant for a row of headline numbers: smaller value,
 * and the hint moves into a tooltip (`title`) instead of taking a line. With
 * `progress` (0–100) it also draws a thin bar under the value — a share of a
 * whole, where a donut and a legend would take four times the room.
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  isLoading = false,
  compact = false,
  progress,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: IconName;
  isLoading?: boolean;
  compact?: boolean;
  progress?: number;
}) {
  return (
    <div
      title={compact ? hint : undefined}
      className={`border-border bg-surface rounded-xl border ${compact ? "px-4 py-3" : "p-5"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <Typography variant="title-4" weight={500} className="text-muted-foreground uppercase tracking-wide">
          {label}
        </Typography>
        {icon ? (
          <span
            aria-hidden
            className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg"
          >
            <Icon icon={icon} className="size-4" />
          </span>
        ) : null}
      </div>
      {isLoading ? (
        <Skeleton className={compact ? "mt-2 h-7 w-16" : "mt-3 h-10 w-24"} />
      ) : (
        <Typography variant={compact ? "h3" : "h1"} as="p" className={`${compact ? "mt-1.5" : "mt-3"} tabular-nums`}>
          {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
        </Typography>
      )}
      {progress === undefined ? null : (
        <div
          role="progressbar"
          aria-label={label}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="bg-foreground/10 mt-2 h-1.5 overflow-hidden rounded-full"
        >
          <div className="bg-primary h-full rounded-full" style={{ width: `${progress}%` }} />
        </div>
      )}
      {hint && !compact ? (
        <Typography variant="body-4" className="text-muted-foreground mt-2">
          {hint}
        </Typography>
      ) : null}
    </div>
  );
}
