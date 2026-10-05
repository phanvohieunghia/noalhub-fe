"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import { useQaSets, type QaSet, type QaSetStatus } from "@noalhub/api/qa";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { Badge, type BadgeTone } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { Select } from "@noalhub/ui/select";
import { Skeleton } from "@noalhub/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
} from "@noalhub/ui/table";
import { Typography } from "@noalhub/ui/typography";

import { AdminErrorState } from "../admin-error-state";

const COLUMN_COUNT = 5;

const STATUS_TONES: Record<QaSetStatus, BadgeTone> = {
  draft: "neutral",
  published: "success",
  archived: "warning",
};

/**
 * Every set, at every status.
 *
 * The filter defaults to "all" rather than "published", and that is the
 * difference between this surface and the learner's: there, `published` is part
 * of the WHERE clause and not an option at all.
 *
 * A freshly generated set showing as `draft` is correct, not "still
 * processing" — the model never publishes, a person does.
 */
export function QaSetsContent() {
  const t = useTranslations("admin.qa");
  const [status, setStatus] = useState<QaSetStatus | "">("");
  const sets = useQaSets(status === "" ? {} : { status });

  const rows = sets.data ?? [];

  return (
    <main className="w-full p-6">
      <div className="max-w-2xl">
        <Typography variant="h4" as="h1">
          {t("sets.title")}
        </Typography>
        <Typography variant="body-3" className="mt-1 opacity-70">
          {t("sets.intro")}
        </Typography>
      </div>

      <div className="mt-4 max-w-xs">
        <Select
          label={t("sets.filterStatus")}
          value={status}
          onChange={(event) => setStatus(event.target.value as QaSetStatus | "")}
          placeholder={t("sets.allStatuses")}
          options={(["draft", "published", "archived"] as const).map((value) => ({
            value,
            label: t(`sets.status.${value}`),
          }))}
        />
      </div>

      {sets.isError ? (
        <div className="mt-4">
          <AdminErrorState error={sets.error} onRetry={() => sets.refetch()} />
        </div>
      ) : (
        <div className="mt-4">
          <TableRoot caption={t("sets.caption")}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("sets.columns.title")}</TableHeaderCell>
                <TableHeaderCell>{t("sets.columns.section")}</TableHeaderCell>
                <TableHeaderCell>{t("sets.columns.status")}</TableHeaderCell>
                <TableHeaderCell>{t("sets.columns.items")}</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">{t("actionsColumn")}</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sets.isPending ? (
                <SkeletonRows />
              ) : rows.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>{t("sets.empty")}</TableEmptyRow>
              ) : (
                rows.map((row) => <SetRow key={row.id} row={row} />)
              )}
            </TableBody>
          </TableRoot>
        </div>
      )}
    </main>
  );
}

function SetRow({ row }: { row: QaSet }) {
  const t = useTranslations("admin.qa");
  const df = useDateFormat();

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link href={`/qa/sets/${row.id}`} className="hover:underline">
          {row.title}
        </Link>
        <span className="block text-body-4 opacity-60">{df.date(row.createdAt)}</span>
      </TableCell>
      <TableCell className="opacity-70">{row.sectionTitle ?? "—"}</TableCell>
      <TableCell>
        <Badge tone={STATUS_TONES[row.status]}>{t(`sets.status.${row.status}`)}</Badge>
      </TableCell>
      <TableCell className="opacity-70">
        {t("sets.itemCount", { count: row.itemCount })}
      </TableCell>
      <TableCell>
        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <Link href={`/qa/sets/${row.id}`}>{t("sets.open")}</Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((row) => (
        <TableRow key={row}>
          {Array.from({ length: COLUMN_COUNT }).map((_, cell) => (
            <TableCell key={cell}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
