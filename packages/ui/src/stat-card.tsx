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
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  isLoading = false,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: IconName;
  isLoading?: boolean;
}) {
  return (
    <div className="border-border bg-surface rounded-xl border p-5">
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
        <Skeleton className="mt-3 h-10 w-24" />
      ) : (
        <Typography variant="h1" as="p" className="mt-3 tabular-nums">
          {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
        </Typography>
      )}
      {hint ? (
        <Typography variant="body-4" className="text-muted-foreground mt-2">
          {hint}
        </Typography>
      ) : null}
    </div>
  );
}
