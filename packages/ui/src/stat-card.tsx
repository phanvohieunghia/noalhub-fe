import { Skeleton } from "./skeleton";
import { Typography } from "./typography";

/**
 * Ô số liệu cho trang tổng quan.
 *
 * `hint` là chỗ nói rõ số này nghĩa là gì và **không** nghĩa là gì — số đếm
 * không kèm định nghĩa là nguồn hiểu sai kinh điển (ví dụ "7 ngày qua" tính
 * theo giờ server, không theo múi giờ người xem).
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
