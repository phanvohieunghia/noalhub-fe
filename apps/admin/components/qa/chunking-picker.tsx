"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import type { Message } from "@noalhub/api/message";
import {
  CHARS_PER_TOKEN,
  CHUNK_MODES,
  CHUNK_OVERLAP_MAX,
  CHUNK_PATTERN_MAX_LENGTH,
  MIN_CHUNK_TOKENS,
  usePreviewChunks,
  type AiCredential,
  type ChunkMode,
  type QaChunkPreview,
  type StartAnalyzeInput,
} from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError, AlertInfo } from "@noalhub/ui/alert";
import { Button } from "@noalhub/ui/button";
import { Input } from "@noalhub/ui/input";
import { Select } from "@noalhub/ui/select";
import { Typography } from "@noalhub/ui/typography";

import { outlineChunkBudget } from "./qa-run-fit";

/** The slice of `analyze`'s body this picker owns. */
export type ChunkingInput = Pick<
  StartAnalyzeInput,
  "chunkMode" | "headingLevel" | "pattern" | "maxChunkTokens" | "overlapParagraphs"
>;

export type ChunkingChoice = {
  /** Spread into the analyze call. Empty when the source fits one call. */
  input: ChunkingInput;
  /** `false` while a field is invalid — Run stays disabled rather than earning a 400. */
  ready: boolean;
  fields: React.ReactNode;
};

type Form = {
  mode: ChunkMode;
  headingLevel: string;
  pattern: string;
  maxTokens: string;
  overlap: string;
};

const INITIAL: Form = {
  mode: "auto",
  headingLevel: "2",
  pattern: "",
  maxTokens: "",
  overlap: "0",
};

/**
 * Only what the chosen mode uses is sent: the backend refuses `pattern` outside
 * `pattern` mode (and `headingLevel` outside `heading`) instead of ignoring it, so a
 * stale value left over from another mode must not travel.
 */
function toInput(form: Form): ChunkingInput {
  return {
    ...(form.mode !== "auto" ? { chunkMode: form.mode } : {}),
    ...(form.mode === "heading" ? { headingLevel: Number(form.headingLevel) } : {}),
    ...(form.mode === "pattern" ? { pattern: form.pattern } : {}),
    ...(form.maxTokens !== "" ? { maxChunkTokens: Number(form.maxTokens) } : {}),
    ...(Number(form.overlap) > 0 ? { overlapParagraphs: Number(form.overlap) } : {}),
  };
}

/**
 * How a long source is cut before the analyze call.
 *
 * The point of the screen is that the cut is **seen before it is paid for**:
 * "Preview" runs the backend's real cutting code (free, no model). Run is a
 * separate, later click, and nothing here calls a billed endpoint.
 *
 * Always shown. When the sources fit one call the block says so and nothing is split
 * unless the person asks (a mode that finds cuts only matters past the budget, but a
 * small `maxTokens` still splits a short source).
 */
export function useChunkingChoice({
  datasetId,
  templateId,
  sourceIds,
  selectedChars,
  credential,
}: {
  datasetId: string;
  templateId: string;
  /** `undefined` = every source, as `analyze` reads it. */
  sourceIds: string[] | undefined;
  selectedChars: number;
  credential: AiCredential | undefined;
}): ChunkingChoice {
  const t = useTranslations("admin.qa.analyze.chunk");
  const m = useMessage();
  const preview = usePreviewChunks(datasetId);

  const [form, setForm] = useState<Form>(INITIAL);
  const [error, setError] = useState<Message | string | null>(null);
  // The preview answers one exact request. Keyed by it, so changing a field, a
  // source or the prompt makes it disappear instead of describing something else.
  const [shown, setShown] = useState<{ key: string; data: QaChunkPreview } | null>(null);

  const tokens = Math.ceil(selectedChars / CHARS_PER_TOKEN);
  const budget = credential ? outlineChunkBudget(credential.model) : undefined;
  const needed = budget !== undefined && tokens > budget;

  // Sent even when the sources fit one call: a person who sets `maxChunkTokens` or a
  // mode on a short source wants it cut anyway, and the backend honours that.
  const input = toInput(form);
  const maxTokens = form.maxTokens === "" ? undefined : Number(form.maxTokens);
  const maxTokensInvalid =
    maxTokens !== undefined && (!Number.isInteger(maxTokens) || maxTokens < MIN_CHUNK_TOKENS);
  const patternMissing = form.mode === "pattern" && form.pattern.trim() === "";
  const ready = !maxTokensInvalid && !patternMissing;

  const keyOf = (value: ChunkingInput) =>
    JSON.stringify({ templateId, credentialId: credential?.id, sourceIds, value });
  const currentKey = keyOf(input);
  // Preview needs the outline prompt too — the backend sizes the chunk budget from that
  // prompt's length.
  const canPreview = Boolean(credential) && templateId !== "";
  const visiblePreview = shown && shown.key === currentKey ? shown.data : null;

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const runPreview = async () => {
    if (!credential) return;
    setError(null);
    try {
      const data = await preview.mutateAsync({
        templateId,
        credentialId: credential.id,
        sourceIds,
        ...input,
      });
      setShown({ key: currentKey, data });
    } catch (e) {
      setError(applyApiError(e, () => undefined, []));
    }
  };

  // `min-w-0` on the fieldset: it defaults to `min-width: min-content`, so one long
  // preview line would stretch the whole dialog instead of being truncated.
  const fields = (
    <fieldset className="min-w-0 space-y-3 rounded-lg border border-border p-3">
      <Typography as="legend" variant="body-3" className="font-semibold">
        {t("title")}
      </Typography>
      <Typography variant="body-4" className="text-muted-foreground">
        {t(needed ? "needed" : "fits", {
          tokens: tokens.toLocaleString(),
          budget: (budget ?? 0).toLocaleString(),
        })}
      </Typography>

      <Select
        label={t("mode")}
        value={form.mode}
        onChange={(event) => set("mode", event.target.value as ChunkMode)}
        hint={t(`modeHint.${form.mode}`)}
        options={CHUNK_MODES.map((mode) => ({ value: mode, label: t(`modes.${mode}`) }))}
      />

      {form.mode === "heading" ? (
        <Select
          label={t("headingLevel")}
          value={form.headingLevel}
          onChange={(event) => set("headingLevel", event.target.value)}
          options={[1, 2, 3, 4].map((level) => ({
            value: String(level),
            label: t("headingLevelOption", { level, marks: "#".repeat(level) }),
          }))}
        />
      ) : null}

      {form.mode === "pattern" ? (
        <Input
          label={t("pattern")}
          hint={t("patternHint")}
          value={form.pattern}
          maxLength={CHUNK_PATTERN_MAX_LENGTH}
          onChange={(event) => set("pattern", event.target.value)}
          error={patternMissing ? t("patternRequired") : undefined}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={t("maxTokens")}
          hint={t("maxTokensHint", { min: MIN_CHUNK_TOKENS.toLocaleString() })}
          inputMode="numeric"
          value={form.maxTokens}
          onChange={(event) => set("maxTokens", event.target.value.replace(/\D/g, ""))}
          error={maxTokensInvalid ? t("maxTokensInvalid", { min: MIN_CHUNK_TOKENS }) : undefined}
        />
        <Select
          label={t("overlap")}
          hint={t("overlapHint")}
          value={form.overlap}
          onChange={(event) => set("overlap", event.target.value)}
          options={Array.from({ length: CHUNK_OVERLAP_MAX + 1 }, (_, n) => ({
            value: String(n),
            label: n === 0 ? t("overlapNone") : t("overlapOption", { count: n }),
          }))}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => void runPreview()}
          disabled={!canPreview || !ready || form.mode === "ai"} loading={preview.isPending}
        >
          {preview.isPending ? t("previewing") : t("preview")}
        </Button>
      </div>
      <Typography variant="body-4" className="text-muted-foreground">
        {!credential ? t("needKey") : canPreview ? t("previewHint") : t("needPromptForPreview")}
      </Typography>

      {form.mode === "ai" ? <AlertInfo message={t("aiNoPreview")} /> : null}

      {visiblePreview ? <PreviewList preview={visiblePreview} /> : null}

      {error ? <AlertError message={m(error)} /> : null}

    </fieldset>
  );

  return { input, ready, fields };
}

/** Where each part starts — the thing a person checks before paying. */
function PreviewList({ preview }: { preview: QaChunkPreview }) {
  const t = useTranslations("admin.qa.analyze.chunk");
  return (
    <div className="min-w-0 space-y-1">
      <Typography variant="body-4" className="font-semibold">
        {t("result.summary", {
          count: preview.chunks.length,
          strategy: preview.strategy,
          total: preview.totalTokens.toLocaleString(),
        })}
      </Typography>
      {preview.note ? (
        <Typography variant="body-4" className="text-muted-foreground">
          {preview.note}
        </Typography>
      ) : null}
      <ol className="max-h-56 space-y-1 overflow-x-hidden overflow-y-auto rounded-md border border-border p-2">
        {preview.chunks.map((chunk) => (
          <li key={chunk.position} className="flex min-w-0 gap-2">
            <Typography variant="body-4" className="w-6 shrink-0 text-muted-foreground">
              {chunk.position}
            </Typography>
            <div className="min-w-0 flex-1">
              <Typography variant="body-4" className="block truncate" title={chunk.startsWith}>
                {chunk.startsWith}
              </Typography>
              <Typography variant="body-4" className="text-muted-foreground">
                {t("result.tokens", { tokens: chunk.tokensEstimate.toLocaleString() })}
              </Typography>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
