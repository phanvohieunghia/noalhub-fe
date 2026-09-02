import { Skeleton } from "./skeleton";
import { Typography } from "./typography";

/**
 * A stat tile for the overview page.
 *
 * `hint` is where the number's meaning — and what it does **not** mean — is
 * spelled out; a count without a definition is the classic source of
 * misreading (e.g. "last 7 days" measured in server time, not the viewer's
 * timezone).
 */
export function StatCard({
  label,
  value,
  hint,
  isLoading = false,
}: {
  label: string;
  value: number | string;
  hint?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-black/10 p-6 dark:border-white/15">
      <Typography variant="title-4" weight={500} className="uppercase tracking-wide opacity-60">
        {label}
      </Typography>
      {isLoading ? (
        <Skeleton className="mt-2 h-10 w-24" />
      ) : (
        <Typography variant="h1" as="p" className="mt-2 tabular-nums">
          {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
        </Typography>
      )}
      {hint ? (
        <Typography variant="body-3" className="mt-2 opacity-60">
          {hint}
        </Typography>
      ) : null}
    </div>
  );
}
