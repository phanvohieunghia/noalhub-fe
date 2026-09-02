"use client";

import { useTranslations } from "next-intl";

import { Button } from "./button";
import { Typography } from "./typography";

/**
 * **Offset** pagination — matching `GET /admin/users` (`page`/`limit`). NOT for
 * chat, which is cursor-based and has no notion of a page number.
 *
 * The component holds no state: the current page comes from the URL's
 * searchParams so links are shareable, and `onPageChange` only reports upward.
 */
export function Pagination({
  page,
  limit,
  total,
  onPageChange,
  /** A new page is loading — disable the buttons so clicks cannot stack up. */
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
      {/* aria-live: changing page by button does not move focus, so a screen
          reader has to be told the new range. */}
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
