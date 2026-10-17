"use client";

import { useTranslations } from "next-intl";

import { Button } from "./button";
import { Icon, ICONS } from "./icons";
import { Select } from "./select";
import { Typography } from "./typography";

/**
 * The footer of a table frame (`TableRoot`'s `footer` slot): a summary on the
 * left, then page size, "Page x of y" and previous/next. Stateless — the owner
 * keeps `page` and `pageSize` and clamps `page` against `pageCount`.
 *
 * Labels that name the thing being listed (`summary`, `perPageLabel`,
 * `formatPageSize`) come in as props so the component pins no app namespace.
 */
export function TablePagination({
  summary,
  page,
  pageCount,
  pageSize,
  pageSizes,
  perPageLabel,
  formatPageSize,
  onPageChange,
  onPageSizeChange,
}: {
  summary: string;
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizes: readonly number[];
  perPageLabel: string;
  formatPageSize: (size: number) => string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const tp = useTranslations("common.pagination");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <Typography variant="body-4" className="text-muted-foreground tabular-nums">
        {summary}
      </Typography>
      <div className="flex items-center gap-3">
        <Select
          size="xs"
          hideLabel
          label={perPageLabel}
          value={String(pageSize)}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          options={pageSizes.map((size) => ({
            value: String(size),
            label: formatPageSize(size),
          }))}
        />
        <Typography variant="body-4" className="text-muted-foreground tabular-nums">
          {tp("current", { page, total: pageCount })}
        </Typography>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon-md"
            aria-label={tp("previous")}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <Icon icon={ICONS.chevronLeft} />
          </Button>
          <Button
            variant="outline"
            size="icon-md"
            aria-label={tp("next")}
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            <Icon icon={ICONS.chevronRight} />
          </Button>
        </div>
      </div>
    </div>
  );
}
