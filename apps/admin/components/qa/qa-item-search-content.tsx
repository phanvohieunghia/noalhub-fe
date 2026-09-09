"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useQaItemSearch, type QaItemKind } from "@noalhub/api/qa";
import { Badge } from "@noalhub/ui/badge";
import { Input } from "@noalhub/ui/input";
import { Select } from "@noalhub/ui/select";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Typography } from "@noalhub/ui/typography";

import { AdminErrorState } from "../admin-error-state";
import { PostContentPreview } from "./post-content-preview";

/**
 * Trigram needs three characters before the index is usable; below that the
 * backend answers 400 rather than running a sequential scan over a table with
 * tens of thousands of rows. So the box does not call until it has three.
 */
const MIN_QUERY = 3;
const DEBOUNCE_MS = 300;

/**
 * Search questions across every set and every shape.
 *
 * Accent-insensitive on **both sides** of the comparison, by way of one backend
 * function: "hoa hoc" finds "hoá học", and so does "dung" for "đúng". That is a
 * feature, not a stray match — hence the line saying so, which saves the
 * question "why did it return this".
 */
export function QaItemSearchContent() {
  const t = useTranslations("admin.qa");
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [kind, setKind] = useState<QaItemKind | "">("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  const ready = debounced.trim().length >= MIN_QUERY;
  const search = useQaItemSearch(
    {
      ...(ready ? { q: debounced.trim() } : {}),
      ...(kind === "" ? {} : { kind }),
    },
    ready || kind !== "",
  );

  return (
    <main className="w-full p-6">
      <div className="max-w-2xl">
        <Typography variant="h4" as="h1">
          {t("items.title")}
        </Typography>
        <Typography variant="body-3" className="mt-1 opacity-70">
          {t("items.intro")}
        </Typography>
      </div>

      <div className="mt-4 grid max-w-3xl gap-3 sm:grid-cols-2">
        <Input
          label={t("items.search")}
          value={term}
          hint={t("items.searchHint", { min: MIN_QUERY })}
          onChange={(event) => setTerm(event.target.value)}
        />
        <Select
          label={t("items.filterKind")}
          value={kind}
          onChange={(event) => setKind(event.target.value as QaItemKind | "")}
          placeholder={t("items.allKinds")}
          options={(["theory", "practice", "recall", "analysis"] as const).map(
            (value) => ({ value, label: t(`items.kinds.${value}`) }),
          )}
        />
      </div>

      {search.isError ? (
        <div className="mt-4">
          <AdminErrorState error={search.error} onRetry={() => search.refetch()} />
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {!ready && kind === "" ? (
          <Typography variant="body-3" className="opacity-70">
            {t("items.typeMore", { min: MIN_QUERY })}
          </Typography>
        ) : search.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : (search.data?.total ?? 0) === 0 ? (
          <Typography variant="body-3" className="opacity-70">
            {t("items.noResults")}
          </Typography>
        ) : (
          <>
            <Typography variant="body-4" className="text-muted-foreground">
              {t("items.found", { count: search.data?.total ?? 0 })}
            </Typography>
            {search.data?.items.map((item) => (
              <article key={item.id} className="rounded-md border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <Badge tone="info">{t(`items.kinds.${item.kind}`)}</Badge>
                  <Link
                    href={`/qa/sets/${item.setId}`}
                    className="text-body-4 hover:underline"
                  >
                    {t("items.openSet")}
                  </Link>
                </div>
                <div className="mt-2">
                  <PostContentPreview doc={item.question} />
                </div>
              </article>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
