"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  createCredentialSchema,
  useAiCredentials,
  useAiModels,
  useCreateAiCredential,
  useDeleteAiCredential,
  useDisableAiCredential,
  useUpdateAiCredential,
  type AiCredential,
  type AiModel,
  type CreateCredentialInput,
} from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import type { Message } from "@noalhub/api/message";
import { useMessage } from "@noalhub/i18n/use-message";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { AlertError, AlertWarning } from "@noalhub/ui/alert";
import { Badge } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { Input } from "@noalhub/ui/input";
import { Select } from "@noalhub/ui/select";
import { Skeleton } from "@noalhub/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
} from "@noalhub/ui/table";
import { Typography } from "@noalhub/ui/typography";

import { AdminErrorState } from "../admin-error-state";

const FIELDS = ["label", "apiKey", "defaultModel", "monthlyTokenLimit"] as const;
const COLUMN_COUNT = 6;

/**
 * The API keys the generate calls run on.
 *
 * Three things on this screen are not obvious and are all deliberate:
 *
 * 1. **There is no "show key" action.** The backend stores the key encrypted
 *    and has no endpoint that reads it back — lose it and you rotate. The last
 *    four characters are shown because that is what every provider dashboard
 *    shows, and it is enough to tell two keys apart.
 * 2. **A model without structured output is disabled, not hidden.** Hidden, the
 *    reader goes looking for their model; disabled with the reason, they learn
 *    why it cannot be used.
 * 3. **Delete disables** — except for a key that never ran (`inUse === false`),
 *    which can be removed for good. `qa_generations` points at the used ones, so
 *    a hard delete would erase which key produced which run.
 */
export function AiCredentialsContent() {
  const t = useTranslations("admin.qa");
  const credentials = useAiCredentials();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<AiCredential | null>(null);
  const [deleting, setDeleting] = useState<AiCredential | null>(null);

  const rows = credentials.data ?? [];
  const hasDefault = rows.some((row) => row.isDefault && row.enabled);

  return (
    <main className="w-full p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <Typography variant="h4" as="h1">
            {t("credentials.title")}
          </Typography>
          <Typography variant="body-3" className="mt-1 opacity-70">
            {t("credentials.intro")}
          </Typography>
        </div>
        <Button onClick={() => setAdding(true)}>{t("credentials.add")}</Button>
      </div>

      {/*
        Without a default key every generate call fails with
        AI_CREDENTIAL_NOT_FOUND, and the message arrives on a screen far from
        here — say it where it can be fixed.
      */}
      {!credentials.isPending && rows.length > 0 && !hasDefault ? (
        <div className="mt-4">
          <AlertWarning message={t("credentials.noDefault")} />
        </div>
      ) : null}

      {credentials.isError ? (
        <div className="mt-4">
          <AdminErrorState
            error={credentials.error}
            onRetry={() => credentials.refetch()}
          />
        </div>
      ) : (
        <div className="mt-4">
          <TableRoot caption={t("credentials.caption")}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("credentials.columns.label")}</TableHeaderCell>
                <TableHeaderCell>{t("credentials.columns.provider")}</TableHeaderCell>
                <TableHeaderCell>{t("credentials.columns.key")}</TableHeaderCell>
                <TableHeaderCell>{t("credentials.columns.model")}</TableHeaderCell>
                <TableHeaderCell>{t("credentials.columns.budget")}</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">{t("actionsColumn")}</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {credentials.isPending ? (
                <SkeletonRows />
              ) : rows.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>
                  {t("credentials.empty")}
                </TableEmptyRow>
              ) : (
                rows.map((row) => (
                  <CredentialRow
                    key={row.id}
                    row={row}
                    onEdit={() => setEditing(row)}
                    onDelete={() => setDeleting(row)}
                  />
                ))
              )}
            </TableBody>
          </TableRoot>
        </div>
      )}

      {adding ? <CreateDialog onClose={() => setAdding(false)} /> : null}
      {editing ? (
        <EditDialog row={editing} onClose={() => setEditing(null)} />
      ) : null}
      {deleting ? (
        <DeleteDialog row={deleting} onClose={() => setDeleting(null)} />
      ) : null}
    </main>
  );
}

function CredentialRow({
  row,
  onEdit,
  onDelete,
}: {
  row: AiCredential;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("admin.qa");
  const df = useDateFormat();
  const disable = useDisableAiCredential();
  const enable = useUpdateAiCredential(row.id);

  return (
    <TableRow className={row.enabled ? undefined : "opacity-50"}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {row.label}
          {row.isDefault ? (
            <Badge tone="info">{t("credentials.default")}</Badge>
          ) : null}
          {row.enabled ? null : (
            <Badge tone="neutral">{t("credentials.disabled")}</Badge>
          )}
        </div>
        <span className="text-body-4 opacity-60">{df.date(row.createdAt)}</span>
      </TableCell>
      <TableCell className="opacity-70">{row.provider}</TableCell>
      {/* Four characters, never more — this is recognition, not recovery. */}
      <TableCell className="font-mono opacity-70">••••{row.keyLast4}</TableCell>
      <TableCell className="opacity-70">{row.defaultModel}</TableCell>
      <TableCell className="opacity-70">
        {row.monthlyTokenLimit === null
          ? t("credentials.unlimited")
          : t("credentials.tokensPerMonth", { count: row.monthlyTokenLimit })}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onEdit}>
            {t("credentials.edit")}
          </Button>
          {row.enabled ? (
            <Button
              variant="outline"
              disabled={disable.isPending}
              onClick={() => disable.mutate(row.id)}
            >
              {t("credentials.disable")}
            </Button>
          ) : (
            // PATCH, not a dedicated route: `enabled` is a plain field there, and
            // the default flag stays off — making it default again is a choice.
            <Button
              variant="outline"
              disabled={enable.isPending}
              onClick={() => enable.mutate({ enabled: true })}
            >
              {t("credentials.enable")}
            </Button>
          )}
          {/* Only a key no run points at — a used one has nothing left but disable. */}
          {row.inUse ? null : (
            <Button variant="outline" className="text-danger" onClick={onDelete}>
              {t("credentials.delete")}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function CreateDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const m = useMessage();
  const create = useCreateAiCredential();
  const models = useAiModels();
  const [formError, setFormError] = useState<Message | string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateCredentialInput>({
    resolver: zodResolver(createCredentialSchema),
    defaultValues: {
      // Overwritten on submit from the chosen model — see `onSubmit`. It is only
      // here because the resolver validates the field before that.
      provider: "openrouter",
      label: "",
      apiKey: "",
      defaultModel: "",
      isDefault: false,
      monthlyTokenLimit: null,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    /*
     * `provider` comes from the CHOSEN MODEL, it is not a field. A model id
     * belongs to exactly one provider (`model-registry.ts`), so asking for both
     * only creates a pair that can disagree — and the disagreement surfaces as
     * the backend's `AI_MODEL_NOT_ALLOWED` on a form that looked filled in
     * correctly. This used to be hardcoded `"openrouter"`, which meant no key
     * for any other provider could be created here at all.
     */
    const provider = models.data?.find((model) => model.id === values.defaultModel)?.provider;
    if (!provider) {
      setFormError(t("credentials.modelsLoadFailed"));
      return;
    }
    try {
      await create.mutateAsync({ ...values, provider });
      onClose();
    } catch (error) {
      setFormError(applyApiError(error, setError, FIELDS));
    }
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={t("credentials.addTitle")}
    >
      <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
        <Input
          label={t("credentials.fields.label")}
          error={errors.label?.message}
          {...register("label")}
        />
        <Input
          label={t("credentials.fields.apiKey")}
          type="password"
          autoComplete="off"
          hint={t("credentials.fields.apiKeyHint")}
          error={errors.apiKey?.message}
          {...register("apiKey")}
        />
        <ModelSelect
          models={models.data ?? []}
          loading={models.isPending}
          error={
            errors.defaultModel?.message ??
            (models.isError ? t("credentials.modelsLoadFailed") : undefined)
          }
          registration={register("defaultModel")}
        />
        <Input
          label={t("credentials.fields.budget")}
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          hint={t("credentials.fields.budgetHint")}
          error={errors.monthlyTokenLimit ? t("credentials.fields.budgetInvalid") : undefined}
          {...register("monthlyTokenLimit", { setValueAs: parseBudget })}
        />
        <label className="flex items-center gap-2 text-body-3">
          <input type="checkbox" {...register("isDefault")} />
          {t("credentials.fields.isDefault")}
        </label>
        {/* `useMessage` turns the error KEY into text at render time — the api
            layer returns a key so the sentence follows the reader's locale. */}
        {formError ? <AlertError message={m(formError)} /> : null}

        {/* Nút ở CUỐI nội dung, không phải ở `actions` — `actions` của Dialog là
            thanh công cụ cạnh nút đóng trên header. Khuôn có sẵn: màn Storybook. */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {tc("actions.save")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function EditDialog({ row, onClose }: { row: AiCredential; onClose: () => void }) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const m = useMessage();
  const update = useUpdateAiCredential(row.id);
  const models = useAiModels();
  const [formError, setFormError] = useState<Message | string | null>(null);
  const [label, setLabel] = useState(row.label);
  const [apiKey, setApiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState(row.defaultModel);
  const [isDefault, setIsDefault] = useState(row.isDefault);
  const [budget, setBudget] = useState(
    row.monthlyTokenLimit === null ? "" : String(row.monthlyTokenLimit),
  );
  const [budgetError, setBudgetError] = useState(false);

  const save = async () => {
    setFormError(null);
    const monthlyTokenLimit = parseBudget(budget);
    // `parseBudget` hands back NaN or a fraction untouched so this check sees it;
    // sending it would only come back as a VALIDATION_FAILED string.
    const invalid =
      monthlyTokenLimit !== null &&
      (!Number.isInteger(monthlyTokenLimit) || monthlyTokenLimit < 1);
    setBudgetError(invalid);
    if (invalid) return;
    try {
      await update.mutateAsync({
        label,
        defaultModel,
        isDefault,
        monthlyTokenLimit,
        // Sending an empty string would rotate the key to "" — only send the
        // field when the operator actually typed a new key.
        ...(apiKey ? { apiKey } : {}),
      });
      onClose();
    } catch (error) {
      setFormError(applyApiError(error, () => undefined, []));
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={t("credentials.editTitle", { label: row.label })}
    >
      <div className="space-y-4">
        <Input
          label={t("credentials.fields.label")}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <Input
          label={t("credentials.fields.rotate")}
          type="password"
          autoComplete="off"
          hint={t("credentials.fields.rotateHint")}
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
        />
        <Select
          label={t("credentials.fields.model")}
          value={defaultModel}
          onChange={(event) => setDefaultModel(event.target.value)}
          // The key's provider is fixed, and a model of another provider is
          // refused with AI_MODEL_NOT_ALLOWED — offer only this provider's.
          options={modelOptions(
            (models.data ?? []).filter((model) => model.provider === row.provider),
            t,
          )}
        />
        <Input
          label={t("credentials.fields.budget")}
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          hint={t("credentials.fields.budgetHint")}
          error={budgetError ? t("credentials.fields.budgetInvalid") : undefined}
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
        />
        <label className="flex items-center gap-2 text-body-3">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(event) => setIsDefault(event.target.checked)}
          />
          {t("credentials.fields.isDefault")}
        </label>
        {/* `useMessage` turns the error KEY into text at render time — the api
            layer returns a key so the sentence follows the reader's locale. */}
        {formError ? <AlertError message={m(formError)} /> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button onClick={() => void save()} disabled={update.isPending}>
            {tc("actions.save")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function DeleteDialog({ row, onClose }: { row: AiCredential; onClose: () => void }) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const m = useMessage();
  const remove = useDeleteAiCredential();
  const [formError, setFormError] = useState<Message | string | null>(null);

  const confirm = async () => {
    setFormError(null);
    try {
      await remove.mutateAsync(row.id);
      onClose();
    } catch (error) {
      // A run that started after the list loaded lands here as
      // AI_CREDENTIAL_IN_USE; the backend message says to disable instead.
      setFormError(applyApiError(error, () => undefined, []));
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={t("credentials.deleteTitle", { label: row.label })}
    >
      <div className="space-y-4">
        <Typography variant="body-3">{t("credentials.deleteBody")}</Typography>
        {formError ? <AlertError message={m(formError)} /> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button
            className="text-danger"
            variant="outline"
            onClick={() => void confirm()}
            disabled={remove.isPending}
          >
            {t("credentials.delete")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function ModelSelect({
  models,
  loading,
  error,
  registration,
}: {
  models: ReturnType<typeof useAiModels>["data"] & object;
  loading: boolean;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm<CreateCredentialInput>>["register"]>;
}) {
  const t = useTranslations("admin.qa");

  return (
    <Select
      label={t("credentials.fields.model")}
      placeholder={loading ? t("loading") : t("credentials.fields.modelPlaceholder")}
      error={error}
      options={modelOptions(models, t)}
      {...registration}
    />
  );
}

/**
 * A model that cannot be forced into a JSON schema stays in the list, disabled,
 * with the reason in its label. Removing it silently is what makes someone ask
 * where their model went.
 */
function modelOptions(
  models: AiModel[],
  t: ReturnType<typeof useTranslations<"admin.qa">>,
) {
  return models.map((model) => ({
    value: model.id,
    // The two limits decide whether a long source fits before anything is
    // billed (QA_CONTEXT_EXCEEDED / QA_OUTPUT_EXCEEDED) — worth seeing at pick time.
    label: model.supportsStructuredOutput
      ? t("credentials.modelOption", {
          label: model.label,
          context: model.contextWindow,
          output: model.maxOutputTokens,
        })
      : t("credentials.modelUnsupported", { label: model.label }),
    disabled: !model.supportsStructuredOutput,
  }));
}

/**
 * Empty means unlimited (`null`), not 0 — the backend has no "zero budget".
 * Anything else goes through as a number, invalid or not, so the validator
 * (zod in the add form, the check in the edit form) is what rejects it.
 */
function parseBudget(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((row) => (
        <TableRow key={row}>
          {Array.from({ length: COLUMN_COUNT }).map((_, cell) => (
            <TableCell key={cell}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
