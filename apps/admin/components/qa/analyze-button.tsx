"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useMe } from "@noalhub/api/auth";
import type { Message } from "@noalhub/api/message";
import { useQaSources, useQaTemplates, useStartAnalyze } from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError, AlertInfo } from "@noalhub/ui/alert";
import { Button } from "@noalhub/ui/button";
import { Checkbox } from "@noalhub/ui/checkbox";
import { Dialog } from "@noalhub/ui/dialog";
import { Icon, LUCIDE } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";
import { Select } from "@noalhub/ui/select";
import { Tooltip } from "@noalhub/ui/tooltip";
import { Typography } from "@noalhub/ui/typography";

import { useAiRunChoice } from "./ai-run-picker";
import { useChunkingChoice } from "./chunking-picker";

/**
 * One of the two buttons that spend money.
 *
 * It is visible only to an account holding `canGenerateAi` — an `admin` writing
 * content has nothing to do with a button that produces an invoice, and the
 * backend answers 403 `AI_NO_QUOTA` if they find it anyway.
 *
 * The confirm step is not ceremony: this is a real charge, and a fire-and-forget
 * button is a button that gets clicked by accident.
 */
export function AnalyzeButton({
  datasetId,
  disabled,
  compact,
  onStarted,
}: {
  datasetId: string;
  disabled?: boolean;
  /** Icon-only, for the editor toolbar: another version, not the first one. */
  compact?: boolean;
  /**
   * Called once the run is accepted. The dialog closes right after, and the
   * caller shows the progress in place — the outline panel itself turns into a
   * "generating" state.
   */
  onStarted: (generationId: string) => void;
}) {
  const t = useTranslations("admin.qa");
  const me = useMe();
  const [open, setOpen] = useState(false);

  if (!me.data?.canGenerateAi) return null;

  return (
    <>
      {compact ? (
        <Tooltip label={t("analyze.another")}>
          {/* The span takes the hover: a disabled button swallows pointer events. */}
          <span className="inline-flex">
            <Button
              size="icon-md"
              variant="outline"
              disabled={disabled}
              aria-label={t("analyze.another")}
              onClick={() => setOpen(true)}
            >
              <Icon icon={LUCIDE.sparkles} />
            </Button>
          </span>
        </Tooltip>
      ) : (
        <Button disabled={disabled} onClick={() => setOpen(true)}>
          {t("analyze.button")}
        </Button>
      )}
      {open ? (
        <AnalyzeDialog
          datasetId={datasetId}
          onStarted={onStarted}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function AnalyzeDialog({
  datasetId,
  onStarted,
  onClose,
}: {
  datasetId: string;
  onStarted: (generationId: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const m = useMessage();
  const templates = useQaTemplates("outline");
  const aiRun = useAiRunChoice();
  const start = useStartAnalyze(datasetId);

  const [templateId, setTemplateId] = useState("");
  const [label, setLabel] = useState("");
  const sources = useQaSources(datasetId);
  const sourceRows = sources.data ?? [];
  // Excluded ids rather than included: new sources default to "in".
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(new Set());
  const selected = sourceRows.filter((row) => !excluded.has(row.id));
  const pickable = sourceRows.length >= 2;
  const toggle = (id: string, on: boolean) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (on) next.delete(id);
      else next.add(id);
      return next;
    });
  const [formError, setFormError] = useState<Message | string | null>(null);

  // What `analyze` will actually read: the whole dataset unless a subset is ticked.
  const sourceIds =
    pickable && selected.length < sourceRows.length
      ? selected.map((row) => row.id)
      : undefined;
  const chunking = useChunkingChoice({
    datasetId,
    templateId,
    sourceIds,
    selectedChars: (pickable ? selected : sourceRows).reduce(
      (sum, row) => sum + row.charCount,
      0,
    ),
    credential: aiRun.credential,
  });

  const usableTemplates = (templates.data ?? []).filter((row) => row.enabled);

  const run = async () => {
    if (!aiRun.credential) return;
    setFormError(null);
    try {
      const result = await start.mutateAsync({
        templateId,
        credentialId: aiRun.credential.id,
        label: label === "" ? undefined : label,
        sourceIds,
        ...chunking.input,
      });
      onStarted(result.generationId);
      onClose();
    } catch (error) {
      // The backend's messages already carry the numbers (how many sections fit,
      // which anchors are stale) — show them rather than a generic sentence.
      setFormError(applyApiError(error, () => undefined, []));
    }
  };

  return (
    // `lg` scrolls inside the viewport (the default size does not): with the chunking
    // block open this dialog is taller than a laptop screen, and the title and Run
    // would sit off-screen.
    <Dialog open onClose={onClose} size="lg" title={t("analyze.title")}>
      <div className="space-y-4">
        <Typography variant="body-3" className="opacity-80">
          {t("analyze.intro")}
        </Typography>

        <Select
          label={t("analyze.template")}
          value={templateId}
          onChange={(event) => setTemplateId(event.target.value)}
          placeholder={
            usableTemplates.length === 0
              ? t("analyze.noTemplate")
              : t("analyze.pickTemplate")
          }
          options={usableTemplates.map((row) => ({
            value: row.id,
            label: row.name,
          }))}
        />

        {pickable ? (
          <fieldset className="space-y-2">
            <div className="flex items-center justify-between">
              <Typography as="legend" variant="body-3" className="font-semibold">
                {t("analyze.sources")}
              </Typography>
              <Typography variant="body-4" className="text-muted-foreground">
                {t("analyze.sourcesHint", {
                  selected: selected.length,
                  total: sourceRows.length,
                })}
              </Typography>
            </div>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              <Checkbox
                label={t("analyze.selectAll")}
                checked={
                  selected.length === sourceRows.length
                    ? true
                    : selected.length === 0
                      ? false
                      : "indeterminate"
                }
                onCheckedChange={(v) =>
                  setExcluded(
                    v === true ? new Set() : new Set(sourceRows.map((r) => r.id)),
                  )
                }
              />
              {sourceRows.map((row) => (
                <Checkbox
                  key={row.id}
                  label={row.title ?? t("analyze.sourceUntitled")}
                  hint={t("analyze.sourceChars", { count: row.charCount })}
                  checked={!excluded.has(row.id)}
                  onCheckedChange={(v) => toggle(row.id, v === true)}
                />
              ))}
            </div>
          </fieldset>
        ) : null}

        {aiRun.fields}

        {/* After the key: asking the model how to split needs one picked. */}
        {chunking.fields}

        <Input
          label={t("analyze.label")}
          hint={t("analyze.labelHint")}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />

        {/* State the price before the click: which key, which model. */}
        {aiRun.empty ? (
          <AlertError message={t("run.noCredentialHint")} />
        ) : aiRun.credential && aiRun.ready ? (
          <AlertInfo
            message={t("analyze.cost", {
              key: aiRun.credential.label,
              model: aiRun.model,
            })}
          />
        ) : null}

        {formError ? <AlertError message={m(formError)} /> : null}
      </div>

      {/* Nút ở CUỐI nội dung, không phải ở `actions` — `actions` của Dialog là
          thanh công cụ cạnh nút đóng trên header. */}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {tc("actions.cancel")}
        </Button>
        <Button
          onClick={() => void run()}
          disabled={
            templateId === "" ||
            !aiRun.ready ||
            !chunking.ready ||
            (pickable && selected.length === 0)
          }
          loading={start.isPending}
        >
          {t("analyze.confirm")}
        </Button>
      </div>
    </Dialog>
  );
}
