"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  isGenerationRunning,
  useQaDatasets,
  useQaActiveGenerations,
  useQaGeneration,
} from "@noalhub/api/qa";
import { AlertWarning } from "@noalhub/ui/alert";
import { Badge } from "@noalhub/ui/badge";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Typography } from "@noalhub/ui/typography";

import { AdminErrorState } from "../admin-error-state";
import { QaFinalStep } from "./qa-final-step";
import { QaSteps, type WorkbenchStep } from "./qa-steps";
import { OutlineStep } from "./qa-outline-step";
import { SetsStep } from "./qa-sets-step";
import { SourcesStep } from "./qa-source-step";

const WORKBENCH_STEPS: readonly WorkbenchStep[] = ["sources", "outline", "sets", "final"];

/**
 * One dataset as a four-step workbench: the header, the pipeline (sources →
 * outline → question sets → final set), and the open step's panel below it. The
 * pipeline is both the progress line and the navigation.
 */
export function QaDatasetDetail({ datasetId }: { datasetId: string }) {
  const t = useTranslations("admin.qa");
  const datasets = useQaDatasets();
  // The open step lives in `?step=` so a reload (or a shared link) lands on the same tab.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const step: WorkbenchStep = WORKBENCH_STEPS.includes(stepParam as WorkbenchStep)
    ? (stepParam as WorkbenchStep)
    : "sources";
  const setStep = (next: WorkbenchStep) => {
    const params = new URLSearchParams(searchParams);
    params.set("step", next);
    router.replace(`${pathname}?${params}`, { scroll: false });
  };
  // A run started from this screen wins; otherwise one the backend reports as still
  // running, so a reload keeps showing it instead of forgetting it.
  const active = useQaActiveGenerations(datasetId);
  const [startedId, setGenerationId] = useState<string>();
  const generationId = startedId ?? active.data?.outline?.id;
  const generation = useQaGeneration(generationId);
  const generating = !!generationId && (!generation.data || isGenerationRunning(generation.data.status));

  // Same for a questions run: the dialog closes once it is accepted and the step
  // shows the run in place.
  const [startedSetsId, setSetsGenerationId] = useState<string>();
  const setsGenerationId = startedSetsId ?? active.data?.qa?.id;
  const setsGeneration = useQaGeneration(setsGenerationId);
  const generatingSets =
    !!setsGenerationId && (!setsGeneration.data || isGenerationRunning(setsGeneration.data.status));

  const dataset = datasets.data?.find((row) => row.id === datasetId);

  if (datasets.isError) {
    return (
      <main className="w-full p-6">
        <AdminErrorState error={datasets.error} onRetry={() => datasets.refetch()} />
      </main>
    );
  }

  return (
    <main className="flex w-full flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <Typography variant="h4" as="h1">
          {dataset?.title ?? <Skeleton className="h-7 w-64" />}
        </Typography>
        {dataset ? (
          <Badge>{t("ws.characters", { count: dataset.sourceCharCount.toLocaleString("en-US") })}</Badge>
        ) : null}
      </div>

      {dataset?.sourceCharWarning ? (
        /* A warning, not a block: the real ceiling is computed from the model
           picked at generate time, and it lives on the backend. */
        <AlertWarning message={t("datasets.charWarning")} />
      ) : null}

      <QaSteps
        active={step}
        onSelect={setStep}
        generating={generating}
        generatingSets={generatingSets}
      />

      {step === "sources" ? <SourcesStep datasetId={datasetId} /> : null}
      {step === "outline" ? (
        <OutlineStep
          datasetId={datasetId}
          generationId={generationId}
          generating={generating}
          onStarted={setGenerationId}
        />
      ) : null}
      {step === "sets" ? (
        <SetsStep
          datasetId={datasetId}
          generationId={setsGenerationId}
          generating={generatingSets}
          onStarted={setSetsGenerationId}
        />
      ) : null}
      {step === "final" ? <QaFinalStep datasetId={datasetId} /> : null}
    </main>
  );
}
