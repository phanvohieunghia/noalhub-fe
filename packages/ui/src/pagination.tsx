"use client";

import { useTranslations } from "next-intl";

import { Button } from "./button";
import { Icon, ICONS } from "./icons";
import { Typography } from "./typography";

/**
 * The page numbers to show: always the first and the last, the current one with
 * a neighbour on each side, and `null` wherever a run was skipped (rendered as
 * an ellipsis). A fixed shape — it never grows past 7 slots, so the bar does not
 * reflow as the reader walks through the pages.
 */
function pageWindow(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const around = [page - 1, page, page + 1].filter(
    (candidate) => candidate > 1 && candidate < pageCount,
  );
  const slots = [1, ...around, pageCount];

  const withGaps: (number | null)[] = [];
  for (const [index, slot] of slots.entries()) {
    const previous = slots[index - 1];
    if (previous !== undefined && slot - previous > 1) withGaps.push(null);
    withGaps.push(slot);
  }
  return withGaps;
}

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
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-3 text-body-3"
    >
      {/* aria-live: changing page by button does not move focus, so a screen
          reader has to be told the new range. */}
      <Typography
        variant="body-3"
        aria-live="polite"
        className="text-muted-foreground tabular-nums"
      >
        {total === 0 ? t("empty") : t("range", { from, to, total })}
      </Typography>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("previous")}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
        >
          <Icon icon={ICONS.chevronLeft} />
        </Button>

        {/* The numbers themselves — one click to any page in reach, instead of
            walking there one press at a time. */}
        {pageWindow(page, pageCount).map((slot, index) =>
          slot === null ? (
            <span
              key={`gap-${index}`}
              aria-hidden
              className="px-1 text-muted-foreground select-none"
            >
              …
            </span>
          ) : (
            <Button
              key={slot}
              variant={slot === page ? "primary" : "ghost"}
              size="sm"
              aria-label={t("page", { page: slot })}
              aria-current={slot === page ? "page" : undefined}
              disabled={isLoading}
              onClick={() => onPageChange(slot)}
              className="tabular-nums"
            >
              {slot}
            </Button>
          ),
        )}

        <Button
          variant="ghost"
          size="sm"
          aria-label={t("next")}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount || isLoading}
        >
          <Icon icon={ICONS.chevronRight} />
        </Button>
      </div>
    </nav>
  );
}
