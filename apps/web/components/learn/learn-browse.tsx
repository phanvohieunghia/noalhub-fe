"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import { useBrowseQaSets, type QaItemKind } from "@noalhub/api/qa";
import { Badge } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { Select } from "@noalhub/ui/select";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Typography } from "@noalhub/ui/typography";

/**
 * The way into the learner surface.
 *
 * It exists because `GET /qa/sets/:id` needs an id and nothing else hands one
 * out — without this screen a learner only reaches a set through a link someone
 * sent them.
 *
 * The button reads "Continue" whenever the backend reports an open attempt.
 * Two different words for two different situations: starting is a decision,
 * continuing is picking up something already half-done.
 */
export function LearnBrowse() {
  const t = useTranslations("web.learn");
  const [kind, setKind] = useState<QaItemKind | "">("");
  const sets = useBrowseQaSets();

  const rows = (sets.data?.items ?? []).filter(
    (row) => kind === "" || row.itemKinds.includes(kind),
  );

  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <Typography variant="h4" as="h1">
        {t("browse.title")}
      </Typography>
      <Typography variant="body-3" className="mt-1 opacity-70">
        {t("browse.intro")}
      </Typography>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="max-w-xs grow">
          <Select
            label={t("browse.filterKind")}
            value={kind}
            onChange={(event) => setKind(event.target.value as QaItemKind | "")}
            placeholder={t("browse.allKinds")}
            options={(["theory", "practice", "recall", "analysis"] as const).map(
              (value) => ({ value, label: t(`kinds.${value}`) }),
            )}
          />
        </div>
        <Button variant="outline" asChild>
          <Link href="/learn/practice">{t("browse.practiceWrong")}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/learn/stats">{t("browse.stats")}</Link>
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {sets.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : rows.length === 0 ? (
          <Typography variant="body-3" className="opacity-70">
            {/* Empty here means no admin has PUBLISHED anything — say that,
                rather than "no data", which reads like something broke. */}
            {sets.data?.total === 0 ? t("browse.emptyNone") : t("browse.emptyFilter")}
          </Typography>
        ) : (
          rows.map((set) => (
            <article
              key={set.id}
              className="rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Typography variant="title-3" as="h2">
                    <Link href={`/learn/sets/${set.id}`} className="hover:underline">
                      {set.title}
                    </Link>
                  </Typography>
                  {set.description ? (
                    <Typography variant="body-3" className="mt-1 opacity-70">
                      {set.description}
                    </Typography>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone="neutral">
                      {t("browse.itemCount", { count: set.itemCount })}
                    </Badge>
                    <Badge tone="info">{t(`shapes.${set.templateKey}`)}</Badge>
                    {set.difficulty ? (
                      <Badge tone="neutral">{t(`difficulty.${set.difficulty}`)}</Badge>
                    ) : null}
                    {set.itemKinds.map((value) => (
                      <Badge key={value} tone="neutral">
                        {t(`kinds.${value}`)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button asChild>
                  <Link href={`/learn/sets/${set.id}`}>
                    {set.openAttemptId ? t("browse.continue") : t("browse.start")}
                  </Link>
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
