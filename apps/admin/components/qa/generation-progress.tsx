"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { isGenerationRunning, useQaGeneration } from "@noalhub/api/qa";
import { AlertError, AlertInfo, AlertWarning } from "@noalhub/ui/alert";
import { Spinner } from "@noalhub/ui/spinner";
import { Typography } from "@noalhub/ui/typography";

/**
 * After the worker has had this long and the row is still `queued`, say so.
 *
 * The likeliest cause is `QA_WORKER_ENABLED=false`, which is the default
 * everywhere except the VPS — without this line the screen spins forever and
 * nobody guesses why.
 */
const NO_WORKER_HINT_MS = 60_000;

/**
 * Watches one run to the end. Polls rather than opening a socket: one job with
 * one person looking at it, for a few minutes.
 *
 * It reports **three** outcomes, not two. `partial` means the model returned
 * valid JSON while dropping whole sections — no error, no warning, just
 * chapters that are not there. Rendering it as success closes the only window
 * onto that.
 */
export function GenerationProgress({
  generationId,
  reused,
  onDone,
}: {
  generationId: string;
  /** The backend found an identical run already going; this is it. */
  reused?: boolean;
  onDone?: () => void;
}) {
  const t = useTranslations("admin.qa");
  const generation = useQaGeneration(generationId);
  const [startedAt] = useState(() => Date.now());
  const [waitedLong, setWaitedLong] = useState(false);

  const status = generation.data?.status;
  const running = status ? isGenerationRunning(status) : true;

  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(
      () => setWaitedLong(true),
      Math.max(NO_WORKER_HINT_MS - (Date.now() - startedAt), 0),
    );
    return () => clearTimeout(timer);
  }, [running, startedAt]);

  useEffect(() => {
    if (!running && status) onDone?.();
    // `onDone` intentionally out of the deps: callers pass an inline closure,
    // and including it re-runs this on every render of the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, status]);

  if (generation.isError) {
    return <AlertError message={t("generation.pollFailed")} />;
  }

  if (running) {
    return (
      <div className="space-y-2 rounded-md border border-border p-3">
        <div className="flex items-center gap-2">
          <Spinner />
          <Typography variant="body-3">
            {status === "queued" ? t("generation.queued") : t("generation.running")}
          </Typography>
        </div>
        {reused ? (
          /* Someone clicked twice: tell them they are watching the run that
             already existed, not that a second one just started. */
          <AlertInfo message={t("generation.reused")} />
        ) : null}
        {waitedLong && status === "queued" ? (
          <AlertWarning message={t("generation.noWorker")} />
        ) : null}
      </div>
    );
  }

  const data = generation.data;
  if (!data) return null;

  if (data.status === "failed") {
    return (
      <div className="space-y-2">
        {/* The backend's message already names the cause — a truncated response
            says "output ceiling", not "invalid JSON". Show it verbatim. */}
        <AlertError message={data.error ?? t("generation.failed")} />
      </div>
    );
  }

  const sectionErrors = Object.entries(data.sectionErrors ?? {});

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <Typography variant="body-3">
        {data.status === "partial"
          ? t("generation.partial", { count: data.resultCount })
          : t("generation.succeeded", { count: data.resultCount })}
      </Typography>

      {data.status === "partial" ? (
        <AlertWarning
          message={
            sectionErrors.length > 0
              ? t("generation.partialDetail", {
                  sections: sectionErrors
                    .map(([anchor, reason]) => `${anchor}: ${reason}`)
                    .join(" · "),
                })
              : t("generation.partialUnknown")
          }
        />
      ) : null}

      <Typography variant="body-4" className="text-muted-foreground">
        {t("generation.tokens", {
          input: data.inputTokens ?? 0,
          output: data.outputTokens ?? 0,
          cached: data.cacheReadInputTokens ?? 0,
        })}
      </Typography>
    </div>
  );
}
