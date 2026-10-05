"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  useAiCredentials,
  useAiModels,
  type AiCredential,
} from "@noalhub/api/qa";
import { Select } from "@noalhub/ui/select";

export type AiRunChoice = {
  credential: AiCredential | undefined;
  model: string;
  /** Both picked — the only state in which a billed call may be sent. */
  ready: boolean;
  /** No enabled key at all: nothing to pick, the dialog should say so. */
  empty: boolean;
  fields: React.ReactNode;
};

/**
 * Key + model for a call that spends money.
 *
 * The backend requires both on `analyze` and `generate-sets` — there is no
 * fallback to the `isDefault` key any more, because a flag somebody set weeks
 * ago should not decide today's invoice. `isDefault` survives only as the
 * pre-selected option, and the key's `defaultModel` as the pre-selected model.
 */
export function useAiRunChoice(): AiRunChoice {
  const t = useTranslations("admin.qa");
  const credentials = useAiCredentials();
  const models = useAiModels();
  const [picked, setPicked] = useState<{
    credentialId?: string;
    model?: string;
  }>({});

  // A disabled key is refused by the backend (`AI_CREDENTIAL_DISABLED`); offering
  // it would only move the error from here to after the click.
  const usable = (credentials.data ?? []).filter((row) => row.enabled);
  const credential =
    usable.find((row) => row.id === picked.credentialId) ??
    (picked.credentialId === undefined
      ? usable.find((row) => row.isDefault)
      : undefined);

  // A model id belongs to exactly one provider, and the backend answers
  // `AI_MODEL_NOT_ALLOWED` for any other pairing — so only that provider's models.
  const providerModels = (models.data ?? []).filter(
    (row) => row.provider === credential?.provider,
  );
  const model = picked.model ?? credential?.defaultModel ?? "";

  const fields = (
    <div className="grid gap-4 sm:grid-cols-2">
      <Select
        label={t("run.credential")}
        value={credential?.id ?? ""}
        onChange={(event) =>
          // Switching key resets the model to that key's own default.
          setPicked({ credentialId: event.target.value })
        }
        placeholder={
          credentials.isPending
            ? t("loading")
            : usable.length === 0
              ? t("run.noCredential")
              : t("run.pickCredential")
        }
        options={usable.map((row) => ({
          value: row.id,
          label: `${row.label} · ${row.provider} · …${row.keyLast4}`,
        }))}
      />
      <Select
        label={t("run.model")}
        value={model}
        onChange={(event) =>
          setPicked((current) => ({
            credentialId: credential?.id ?? current.credentialId,
            model: event.target.value,
          }))
        }
        disabled={!credential}
        placeholder={
          models.isPending
            ? t("loading")
            : models.isError
              ? t("credentials.modelsLoadFailed")
              : t("run.pickModel")
        }
        options={providerModels.map((row) => ({
          value: row.id,
          label: row.supportsStructuredOutput
            ? row.label
            : t("credentials.modelUnsupported", { label: row.label }),
          disabled: !row.supportsStructuredOutput,
        }))}
      />
    </div>
  );

  return {
    credential,
    model,
    ready: credential !== undefined && model !== "",
    empty: !credentials.isPending && usable.length === 0,
    fields,
  };
}
