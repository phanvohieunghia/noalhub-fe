"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useMe } from "@noalhub/api/auth";
import type { Message } from "@noalhub/api/message";
import {
  useQaTemplates,
  useStartAnalyze,
} from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError, AlertInfo } from "@noalhub/ui/alert";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { Input } from "@noalhub/ui/input";
import { Select } from "@noalhub/ui/select";
import { Typography } from "@noalhub/ui/typography";

import { useAiRunChoice } from "./ai-run-picker";
import { GenerationProgress } from "./generation-progress";

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
}: {
  datasetId: string;
  disabled?: boolean;
}) {
  const t = useTranslations("admin.qa");
  const me = useMe();
  const [open, setOpen] = useState(false);

  if (!me.data?.canGenerateAi) return null;

  return (
    <>
      <Button disabled={disabled} onClick={() => setOpen(true)}>
        {t("analyze.button")}
      </Button>
      {open ? (
        <AnalyzeDialog datasetId={datasetId} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function AnalyzeDialog({
  datasetId,
  onClose,
}: {
  datasetId: string;
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
  const [formError, setFormError] = useState<Message | string | null>(null);
  const [started, setStarted] = useState<{
    id: string;
    reused: boolean;
  } | null>(null);

  const usableTemplates = (templates.data ?? []).filter((row) => row.enabled);

  const run = async () => {
    if (!aiRun.credential) return;
    setFormError(null);
    try {
      const result = await start.mutateAsync({
        templateId,
        credentialId: aiRun.credential.id,
        model: aiRun.model,
        label: label === "" ? undefined : label,
      });
      setStarted({ id: result.generationId, reused: result.reused });
    } catch (error) {
      // The backend's messages already carry the numbers (how many sections fit,
      // which anchors are stale) — show them rather than a generic sentence.
      setFormError(applyApiError(error, () => undefined, []));
    }
  };

  return (
    <Dialog open onClose={onClose} title={t("analyze.title")}>
      {started ? (
        <GenerationProgress generationId={started.id} reused={started.reused} />
      ) : (
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

          {aiRun.fields}

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
      )}

      {/* Nút ở CUỐI nội dung, không phải ở `actions` — `actions` của Dialog là
          thanh công cụ cạnh nút đóng trên header. */}
      <div className="mt-4 flex justify-end gap-2">
        {started ? (
          <Button onClick={onClose}>{tc("actions.close")}</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              {tc("actions.cancel")}
            </Button>
            <Button
              onClick={() => void run()}
              disabled={templateId === "" || !aiRun.ready || start.isPending}
            >
              {t("analyze.confirm")}
            </Button>
          </>
        )}
      </div>
    </Dialog>
  );
}
