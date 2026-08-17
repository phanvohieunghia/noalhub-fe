/**
 * Pill số tin chưa đọc. Số trần không đủ cho screen reader → kèm `sr-only`
 * diễn giải đầy đủ.
 */
export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 py-0.5 text-[11px] font-semibold text-background">
      <span aria-hidden>{count > 99 ? "99+" : count}</span>
      <span className="sr-only">{count} tin chưa đọc</span>
    </span>
  );
}
