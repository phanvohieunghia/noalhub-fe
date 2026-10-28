"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";

import {
  isGenerationRunning,
  useQaDatasets,
  useQaActiveGenerations,
  useQaGeneration,
} from "@noalhub/api/qa";

import { AdminErrorState } from "../admin-error-state";
import { QaFinalStep } from "./qa-final-step";
import { QaSteps, type WorkbenchStep } from "./qa-steps";
import { OutlineStep } from "./qa-outline-step";
import { SetsStep } from "./qa-sets-step";
import { SourcesStep } from "./qa-source-step";
import { useFaviconBadge } from "./use-favicon-badge";

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
  // The tab itself is local state, so a switch paints at once; the URL follows in a
  // transition instead of gating the switch on a Next navigation.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const initialStep: WorkbenchStep = WORKBENCH_STEPS.includes(stepParam as WorkbenchStep)
    ? (stepParam as WorkbenchStep)
    : "sources";
  const [step, setStepState] = useState<WorkbenchStep>(initialStep);
  // Panels stay mounted once opened and are only hidden afterwards: remounting a step
  // rebuilt its editor and re-parsed the whole document on every switch.
  const [visited, setVisited] = useState<readonly WorkbenchStep[]>([initialStep]);
  const setStep = (next: WorkbenchStep) => {
    setStepState(next);
    setVisited((prev) => (prev.includes(next) ? prev : [...prev, next]));
    const params = new URLSearchParams(searchParams);
    params.set("step", next);
    startTransition(() => {
      router.replace(`${pathname}?${params}`, { scroll: false });
    });
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

  useFaviconBadge(generating || generatingSets);

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
      {/* The title and its size are in the breadcrumb; the heading stays for screen readers. */}
      <h1 className="sr-only">{dataset?.title}</h1>

      <QaSteps
        active={step}
        onSelect={setStep}
        generating={generating}
        generatingSets={generatingSets}
      />

      {visited.includes("sources") ? (
        <div className={step === "sources" ? "contents" : "hidden"}>
          <SourcesStep datasetId={datasetId} />
        </div>
      ) : null}
      {visited.includes("outline") ? (
        <div className={step === "outline" ? "contents" : "hidden"}>
          <OutlineStep
            datasetId={datasetId}
            sourceLarge={dataset?.sourceCharWarning ?? false}
            generationId={generationId}
            generating={generating}
            onStarted={setGenerationId}
          />
        </div>
      ) : null}
      {visited.includes("sets") ? (
        <div className={step === "sets" ? "contents" : "hidden"}>
          <SetsStep
            datasetId={datasetId}
            generationId={setsGenerationId}
            generating={generatingSets}
            onStarted={setSetsGenerationId}
          />
        </div>
      ) : null}
      {visited.includes("final") ? (
        <div className={step === "final" ? "contents" : "hidden"}>
          <QaFinalStep datasetId={datasetId} />
        </div>
      ) : null}
    </main>
  );
}
