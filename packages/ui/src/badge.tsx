type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

/**
 * A small status label. `tone` is **semantic**, not a color — the call site says
 * "warning", never "yellow", so the palette changes in exactly one place later.
 *
 * `warning` is deliberately separate from `danger`: §3b of
 * `docs/admin-plan.md` requires telling a temporary lock (`suspended`) apart
 * from a permanent one (`banned`); one shade of red for both invites the wrong
 * click.
 */
export function Badge({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  const tones: Record<BadgeTone, string> = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/12 text-danger",
    info: "bg-highlight text-highlight-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-body-4 font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
