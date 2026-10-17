"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useQaSet, useQaSets } from "@noalhub/api/qa";
import { AlertWarning } from "@noalhub/ui/alert";
import { Select } from "@noalhub/ui/select";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Typography } from "@noalhub/ui/typography";

import { AdminErrorState } from "../admin-error-state";
import { QaItemForm } from "./qa-item-form";

function PageHeading({ title, intro }: { title: string; intro: string }) {
  return (
    <div className="max-w-2xl">
      <Typography variant="h4" as="h1">
        {title}
      </Typography>
      <Typography variant="body-3" className="mt-1 text-muted-foreground">
        {intro}
      </Typography>
    </div>
  );
}

/**
 * A new question always lands in a DRAFT set: once a set has left draft its
 * question shape is locked, so the picker lists nothing else. `initialSetId`
 * comes from the "Add question" button on a set page.
 */
export function QaItemCreateContent({ initialSetId }: { initialSetId?: string }) {
  const t = useTranslations("admin.qa");
  const sets = useQaSets({ status: "draft" });
  const [setId, setSetId] = useState(initialSetId ?? "");

  return (
    <main className="flex w-full flex-col gap-4 p-6">
      <PageHeading title={t("form.createTitle")} intro={t("form.createIntro")} />

      {sets.isError ? (
        <AdminErrorState error={sets.error} onRetry={() => sets.refetch()} />
      ) : sets.isPending ? (
        <Skeleton className="h-64 w-full max-w-3xl" />
      ) : (sets.data ?? []).length === 0 ? (
        <AlertWarning message={t("form.noDraftSets")} />
      ) : (
        <>
          <div className="max-w-sm">
            <Select
              label={t("form.targetSet")}
              value={setId}
              onChange={(event) => setSetId(event.target.value)}
              placeholder={t("form.pickSet")}
              options={(sets.data ?? []).map((set) => ({ value: set.id, label: set.title }))}
            />
          </div>
          {/* Keyed by set: switching target must not carry half-typed answers over. */}
          {setId ? <QaItemForm key={setId} setId={setId} /> : null}
        </>
      )}
    </main>
  );
}

export function QaItemEditContent({ setId, itemId }: { setId: string; itemId: string }) {
  const t = useTranslations("admin.qa");
  const set = useQaSet(setId);
  const item = set.data?.items.find((entry) => entry.id === itemId);

  return (
    <main className="flex w-full flex-col gap-4 p-6">
      <PageHeading
        title={t("form.editTitle")}
        intro={set.data ? t("sets.fromSection", { section: set.data.title }) : ""}
      />

      {set.isError ? (
        <AdminErrorState error={set.error} onRetry={() => set.refetch()} />
      ) : set.isPending ? (
        <Skeleton className="h-64 w-full max-w-3xl" />
      ) : !item ? (
        <AlertWarning message={t("form.itemMissing")} />
      ) : set.data.status !== "draft" ? (
        <AlertWarning message={t("sets.lockedShape")} />
      ) : (
        <QaItemForm setId={setId} item={item} />
      )}
    </main>
  );
}
