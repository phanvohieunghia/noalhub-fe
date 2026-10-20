"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  useAiCredentials,
  type AiCredential,
  type AiModel,
} from "@noalhub/api/qa";
import { AlertWarning } from "@noalhub/ui/alert";
import { Select } from "@noalhub/ui/select";
import { Typography } from "@noalhub/ui/typography";

export type AiRunChoice = {
  credential: AiCredential | undefined;
  /** The model the picked key runs — read-only here, changed on the AI keys screen. */
  modelInfo: AiModel | undefined;
  /** Display name of that model, `""` until a key is picked. */
  model: string;
  /** A key is picked and its model can run — the only state in which a billed call may be sent. */
  ready: boolean;
  /** No enabled key at all: nothing to pick, the dialog should say so. */
  empty: boolean;
  fields: React.ReactNode;
};

/**
 * The key for a call that spends money.
 *
 * The backend requires `credentialId` on `analyze` and `generate-sets` — there is
 * no fallback to the `isDefault` key any more, because a flag somebody set weeks
 * ago should not decide today's invoice. `isDefault` survives only as the
 * pre-selected option. The model is not picked here: it belongs to the key
 * (chosen when the key is created or edited), so choosing the key already
 * answers "which model is this billed on".
 */
export function useAiRunChoice(): AiRunChoice {
  const t = useTranslations("admin.qa");
  const credentials = useAiCredentials();
  const [pickedId, setPickedId] = useState<string | undefined>();

  // A disabled key is refused by the backend (`AI_CREDENTIAL_DISABLED`); offering
  // it would only move the error from here to after the click.
  const usable = (credentials.data ?? []).filter((row) => row.enabled);
  const credential =
    usable.find((row) => row.id === pickedId) ??
    (pickedId === undefined ? usable.find((row) => row.isDefault) : undefined);

  const modelInfo = credential?.model;
  // Mirrors the backend's `AI_MODEL_NOT_ALLOWED`: a model that was switched off, or
  // cannot be forced into a JSON schema, is refused before the call.
  const modelUsable =
    modelInfo !== undefined && modelInfo.enabled && modelInfo.supportsStructuredOutput;

  const fields = (
    <div className="space-y-2">
      <Select
        label={t("run.credential")}
        value={credential?.id ?? ""}
        onChange={(event) => setPickedId(event.target.value)}
        placeholder={
          credentials.isPending
            ? t("loading")
            : usable.length === 0
              ? t("run.noCredential")
              : t("run.pickCredential")
        }
        options={usable.map((row) => ({
          value: row.id,
          label: `${row.label} · ${row.model.label} · …${row.keyLast4}`,
        }))}
      />
      {modelInfo && modelUsable ? (
        <Typography variant="body-4" className="opacity-70">
          {t("run.modelOfKey", {
            label: modelInfo.label,
            context: modelInfo.contextWindow,
            output: modelInfo.maxOutputTokens,
          })}
        </Typography>
      ) : null}
      {modelInfo && !modelUsable ? (
        <AlertWarning message={t("run.modelUnavailable", { label: modelInfo.label })} />
      ) : null}
    </div>
  );

  return {
    credential,
    modelInfo,
    model: modelInfo?.label ?? "",
    ready: credential !== undefined && modelUsable,
    empty: !credentials.isPending && usable.length === 0,
    fields,
  };
}
