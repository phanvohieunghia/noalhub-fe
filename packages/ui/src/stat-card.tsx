import { Skeleton } from "./skeleton";

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
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
      <p className="text-xs font-medium uppercase tracking-wide opacity-60">
        {label}
      </p>
      {isLoading ? (
        <Skeleton className="mt-2 h-8 w-20" />
      ) : (
        <p className="mt-1 text-3xl font-semibold tabular-nums">
          {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
        </p>
      )}
      {hint ? <p className="mt-1 text-xs opacity-60">{hint}</p> : null}
    </div>
  );
}
