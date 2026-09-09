"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { useQaStats } from "@noalhub/api/qa";
import { Button } from "@noalhub/ui/button";
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

/**
 * Right and wrong per question kind — "where am I weak".
 *
 * The two grading modes are shown as **separate, labelled groups and never
 * summed**. `auto` is the machine matching an answer key; `self` is you saying
 * you remembered a flashcard. Adding them produces an "accuracy" figure that
 * means nothing, and avoiding exactly that is why the backend stores the mode
 * at all.
 */
export function LearnStats() {
  const t = useTranslations("web.learn");
  const stats = useQaStats();

  const rows = stats.data ?? [];
  const groups = (["auto", "self"] as const).filter((mode) =>
    rows.some((row) => row.grading === mode),
  );

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Typography variant="h4" as="h1">
          {t("stats.title")}
        </Typography>
        <Button variant="outline" asChild>
          <Link href="/learn">{t("attempt.backToBrowse")}</Link>
        </Button>
      </div>

      {stats.isPending ? (
        <Skeleton className="mt-6 h-32 w-full" />
      ) : rows.length === 0 ? (
        <Typography variant="body-3" className="mt-6 opacity-70">
          {t("stats.empty")}
        </Typography>
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map((mode) => (
            <section key={mode}>
              <Typography variant="title-3" as="h2">
                {t(`stats.groups.${mode}`)}
              </Typography>
              <Typography variant="body-4" className="mt-1 text-muted-foreground">
                {t(`stats.groupHints.${mode}`)}
              </Typography>
              <div className="mt-3">
                <TableRoot caption={t(`stats.groups.${mode}`)}>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>{t("stats.columns.kind")}</TableHeaderCell>
                      <TableHeaderCell>{t("stats.columns.answered")}</TableHeaderCell>
                      <TableHeaderCell>{t("stats.columns.correct")}</TableHeaderCell>
                      <TableHeaderCell>{t("stats.columns.rate")}</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.filter((row) => row.grading === mode).length === 0 ? (
                      <TableEmptyRow colSpan={4}>{t("stats.empty")}</TableEmptyRow>
                    ) : (
                      rows
                        .filter((row) => row.grading === mode)
                        .map((row) => (
                          <TableRow key={`${row.grading}-${row.kind}`}>
                            <TableCell>{t(`kinds.${row.kind}`)}</TableCell>
                            <TableCell>{row.answered}</TableCell>
                            <TableCell>{row.correct}</TableCell>
                            <TableCell>
                              {Math.round((row.correct / row.answered) * 100)}%
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </TableRoot>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
