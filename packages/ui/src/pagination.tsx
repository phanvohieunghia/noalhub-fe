"use client";

import { Button } from "./button";

/**
 * Phân trang **offset** — hợp với `GET /admin/users` (`page`/`limit`), KHÔNG
 * dùng cho chat (cursor-based, không có khái niệm số trang).
 *
 * Component không giữ state: trang hiện tại đến từ URL searchParams để link
 * share được, và `onPageChange` chỉ báo ngược lên.
 */
export function Pagination({
  page,
  limit,
  total,
  onPageChange,
  /** Đang tải trang mới — khoá nút để tránh bấm dồn nhiều trang. */
  isLoading = false,
}: {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}) {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Phân trang"
      className="flex flex-wrap items-center justify-between gap-3 pt-3 text-sm"
    >
      {/* aria-live: đổi trang bằng nút không làm focus nhảy, screen reader cần
          được báo phạm vi mới. */}
      <p aria-live="polite" className="opacity-70">
        {total === 0 ? "Không có kết quả" : `${from}–${to} trên ${total}`}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
        >
          Trước
        </Button>
        <span className="px-1 tabular-nums opacity-70">
          {page}/{pageCount}
        </span>
        <Button
          variant="outline"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount || isLoading}
        >
          Sau
        </Button>
      </div>
    </nav>
  );
}
