"use client";

import { useTranslations } from "next-intl";

import { Button } from "./button";
import { Typography } from "./typography";

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
  const t = useTranslations("common.pagination");
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav
      aria-label={t("label")}
      className="flex flex-wrap items-center justify-between gap-3 pt-3 text-body-3"
    >
      {/* aria-live: đổi trang bằng nút không làm focus nhảy, screen reader cần
          được báo phạm vi mới. */}
      <Typography variant="body-2" aria-live="polite" className="opacity-70">
        {total === 0 ? t("empty") : t("range", { from, to, total })}
      </Typography>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
        >
          {t("prevShort")}
        </Button>
        <span className="px-1 tabular-nums opacity-70">
          {page}/{pageCount}
        </span>
        <Button
          variant="outline"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount || isLoading}
        >
          {t("nextShort")}
        </Button>
      </div>
    </nav>
  );
}
