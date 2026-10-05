"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import {
  findSourceVariables,
  FORBIDDEN_PROMPT_VARIABLES,
  MAX_ITEMS_PER_SET,
  PROMPT_VARIABLES,
  useCreateQaTemplate,
  useDisableQaTemplate,
  useDuplicateQaTemplate,
  useQaTemplates,
  useUpdateQaTemplate,
  type QaPromptKind,
  type QaPromptTemplate,
} from "@noalhub/api/qa";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import type { Message } from "@noalhub/api/message";
import { useMessage } from "@noalhub/i18n/use-message";
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
import { Textarea } from "@noalhub/ui/textarea";
import { Typography } from "@noalhub/ui/typography";

import { AdminErrorState } from "../admin-error-state";

const COLUMN_COUNT = 5;

/** Must match a shape in the backend registry when `kind = "qa"`. */
const QA_TEMPLATE_KEYS = [
  "multiple_choice",
  "true_false",
  "short_answer",
  "fill_blank",
  "flashcard",
] as const;

/**
 * The prompts the two generate stages run on.
 *
 * The table is **empty after a fresh migration and that is the correct state** —
 * the backend seeds nothing. A prompt is user data, and user data in a migration
 * is data that `down` cannot put back the way it was; on top of that, a prompt
 * that suits every textbook is a prompt nobody has tried.
 */
export function QaTemplatesContent() {
  const t = useTranslations("admin.qa");
  const [kind, setKind] = useState<QaPromptKind | "">("");
  const templates = useQaTemplates(kind === "" ? undefined : kind);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<QaPromptTemplate | null>(null);
  const [duplicating, setDuplicating] = useState<QaPromptTemplate | null>(null);

  const rows = templates.data ?? [];

  return (
    <main className="w-full p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <Typography variant="h4" as="h1">
            {t("templates.title")}
          </Typography>
          <Typography variant="body-3" className="mt-1 opacity-70">
            {t("templates.intro")}
          </Typography>
        </div>
        <Button onClick={() => setCreating(true)}>{t("templates.add")}</Button>
      </div>

      <div className="mt-4 max-w-xs">
        <Select
          label={t("templates.filterKind")}
          value={kind}
          onChange={(event) => setKind(event.target.value as QaPromptKind | "")}
          placeholder={t("templates.allKinds")}
          options={[
            { value: "outline", label: t("templates.kinds.outline") },
            { value: "qa", label: t("templates.kinds.qa") },
          ]}
        />
      </div>

      {templates.isError ? (
        <div className="mt-4">
          <AdminErrorState
            error={templates.error}
            onRetry={() => templates.refetch()}
          />
        </div>
      ) : (
        <div className="mt-4">
          <TableRoot caption={t("templates.caption")}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("templates.columns.name")}</TableHeaderCell>
                <TableHeaderCell>{t("templates.columns.kind")}</TableHeaderCell>
                <TableHeaderCell>{t("templates.columns.key")}</TableHeaderCell>
                <TableHeaderCell>
                  {t("templates.columns.defaults")}
                </TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">{t("actionsColumn")}</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.isPending ? (
                <SkeletonRows />
              ) : rows.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>
                  {t("templates.empty")}
                </TableEmptyRow>
              ) : (
                rows.map((row) => (
                  <TemplateRow
                    key={row.id}
                    row={row}
                    onEdit={() => setEditing(row)}
                    onDuplicate={() => setDuplicating(row)}
                  />
                ))
              )}
            </TableBody>
          </TableRoot>
        </div>
      )}

      {creating ? <TemplateDialog onClose={() => setCreating(false)} /> : null}
      {editing ? (
        <TemplateDialog row={editing} onClose={() => setEditing(null)} />
      ) : null}
      {duplicating ? (
        <DuplicateDialog
          row={duplicating}
          onClose={() => setDuplicating(null)}
        />
      ) : null}
    </main>
  );
}

function TemplateRow({
  row,
  onEdit,
  onDuplicate,
}: {
  row: QaPromptTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
}) {
  const t = useTranslations("admin.qa");
  const disable = useDisableQaTemplate();

  return (
    <TableRow className={row.enabled ? undefined : "opacity-50"}>
      <TableCell className="font-medium">
        {row.name}
        {row.enabled ? null : (
          <Badge tone="neutral" className="ml-2">
            {t("templates.disabled")}
          </Badge>
        )}
      </TableCell>
      <TableCell className="opacity-70">
        {t(`templates.kinds.${row.kind}`)}
      </TableCell>
      <TableCell className="font-mono opacity-70">{row.key}</TableCell>
      <TableCell className="opacity-70">
        {row.defaults?.count
          ? t("templates.defaultCount", { count: row.defaults.count })
          : "—"}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onEdit}>
            {t("templates.edit")}
          </Button>
          <Button variant="outline" onClick={onDuplicate}>
            {t("templates.duplicate")}
          </Button>
          {row.enabled ? (
            <Button
              variant="outline"
              disabled={disable.isPending}
              onClick={() => disable.mutate(row.id)}
            >
              {t("templates.disable")}
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

/**
 * One dialog for both create and edit. `kind` and `key` are read-only once the
 * row exists: `qa_generations.template_id` points at it, and changing `key`
 * changes the shape every item already generated was written against.
 */
function TemplateDialog({
  row,
  onClose,
}: {
  row?: QaPromptTemplate;
  onClose: () => void;
}) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const m = useMessage();
  const create = useCreateQaTemplate();
  const update = useUpdateQaTemplate(row?.id ?? "");
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const [kind, setKind] = useState<QaPromptKind>(row?.kind ?? "outline");
  const [key, setKey] = useState(row?.key ?? "");
  const [name, setName] = useState(row?.name ?? "");
  const [prompt, setPrompt] = useState(row?.prompt ?? "");
  const [count, setCount] = useState(row?.defaults?.count?.toString() ?? "");
  const [formError, setFormError] = useState<Message | string | null>(null);

  // Checked as they type, not on submit: being refused after composing a long
  // prompt is the worst moment to learn the rule.
  const sourceVariables = findSourceVariables(prompt);
  const countValue = count === "" ? undefined : Number(count);
  const countTooBig =
    countValue !== undefined && countValue > MAX_ITEMS_PER_SET;

  const insertVariable = (variable: string) => {
    const field = promptRef.current;
    const token = `{{${variable}}}`;
    if (!field) {
      setPrompt((current) => current + token);
      return;
    }
    const start = field.selectionStart ?? prompt.length;
    const end = field.selectionEnd ?? prompt.length;
    setPrompt(prompt.slice(0, start) + token + prompt.slice(end));
    // Put the caret after what was just inserted, or the next click lands in a
    // place the writer did not choose.
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const save = async () => {
    setFormError(null);
    const defaults = countValue === undefined ? null : { count: countValue };
    try {
      if (row) {
        await update.mutateAsync({ name, prompt, defaults });
      } else {
        await create.mutateAsync({ kind, key, name, prompt, defaults });
      }
      onClose();
    } catch (error) {
      setFormError(applyApiError(error, () => undefined, []));
    }
  };

  const canSave =
    sourceVariables.length === 0 && !countTooBig && prompt.trim() !== "";

  return (
    <Dialog
      open
      onClose={onClose}
      size="fullscreen"
      title={
        row
          ? t("templates.editTitle", { name: row.name })
          : t("templates.addTitle")
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t("templates.fields.kind")}
            value={kind}
            disabled={Boolean(row)}
            onChange={(event) => setKind(event.target.value as QaPromptKind)}
            options={[
              { value: "outline", label: t("templates.kinds.outline") },
              { value: "qa", label: t("templates.kinds.qa") },
            ]}
          />
          <KeyField
            kind={kind}
            value={key}
            disabled={Boolean(row)}
            onChange={setKey}
          />
        </div>

        <Input
          label={t("templates.fields.name")}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Typography variant="title-4">
              {t("templates.fields.variables")}
            </Typography>
            {PROMPT_VARIABLES.map((variable) => (
              <Button
                key={variable}
                variant="outline"
                onClick={() => insertVariable(variable)}
              >
                {`{{${variable}}}`}
              </Button>
            ))}
          </div>
          <Typography variant="body-3" className="text-muted-foreground">
            {t("templates.fields.variablesHint", {
              forbidden: FORBIDDEN_PROMPT_VARIABLES.map((v) => `{{${v}}}`).join(
                ", ",
              ),
            })}
          </Typography>
        </div>

        <Textarea
          ref={promptRef}
          label={t("templates.fields.prompt")}
          rows={14}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />

        {sourceVariables.length > 0 ? (
          <AlertWarning
            message={t("templates.sourceVariable", {
              variables: sourceVariables.map((v) => `{{${v}}}`).join(", "),
            })}
          />
        ) : null}

        <Input
          label={t("templates.fields.count")}
          type="number"
          min={1}
          max={MAX_ITEMS_PER_SET}
          value={count}
          hint={t("templates.fields.countHint", { max: MAX_ITEMS_PER_SET })}
          error={
            countTooBig
              ? t("templates.countTooBig", { max: MAX_ITEMS_PER_SET })
              : undefined
          }
          onChange={(event) => setCount(event.target.value)}
        />

        {/* `useMessage` turns the error KEY into text at render time — the api
            layer returns a key so the sentence follows the reader's locale. */}
        {formError ? <AlertError message={m(formError)} /> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button onClick={() => void save()} disabled={!canSave}>
            {tc("actions.save")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * A dropdown, not a free text box, when `kind = "qa"`: `key` must match a shape
 * in the backend registry, and one typo saves fine but generates nothing.
 */
function KeyField({
  kind,
  value,
  disabled,
  onChange,
}: {
  kind: QaPromptKind;
  value: string;
  disabled?: boolean;
  onChange: (key: string) => void;
}) {
  const t = useTranslations("admin.qa");
  return kind === "qa" ? (
    <Select
      label={t("templates.fields.key")}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder={t("templates.fields.keyPlaceholder")}
      options={QA_TEMPLATE_KEYS.map((option) => ({
        value: option,
        label: t(`templates.shapes.${option}`),
      }))}
    />
  ) : (
    <Input
      label={t("templates.fields.key")}
      value={value}
      disabled={disabled}
      hint={t("templates.fields.keyHint")}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

/**
 * Confirms the two things a copy cannot inherit before anything is written:
 * `key` is unique within a `kind`, and it is the one field that cannot be edited
 * afterwards — so a one-click duplicate would leave the admin with a row they
 * can only disable. For `kind = "qa"` the key comes from the registry, so the
 * copy starts with the source's key selected and the backend's 409 tells them
 * to pick another; for `outline` we suggest `<key>_copy`.
 */
function DuplicateDialog({
  row,
  onClose,
}: {
  row: QaPromptTemplate;
  onClose: () => void;
}) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const m = useMessage();
  const duplicate = useDuplicateQaTemplate();

  const [name, setName] = useState(
    t("templates.copySuffix", { name: row.name }),
  );
  const [key, setKey] = useState(
    row.kind === "qa" ? row.key : `${row.key}_copy`,
  );
  const [formError, setFormError] = useState<Message | string | null>(null);

  const save = async () => {
    setFormError(null);
    try {
      await duplicate.mutateAsync({ id: row.id, input: { key, name } });
      onClose();
    } catch (error) {
      setFormError(applyApiError(error, () => undefined, []));
    }
  };

  const canSave =
    name.trim() !== "" && key.trim() !== "" && !duplicate.isPending;

  return (
    <Dialog
      open
      onClose={onClose}
      title={t("templates.duplicateTitle", { name: row.name })}
    >
      <div className="space-y-4">
        <Typography variant="body-3" className="opacity-70">
          {t("templates.duplicateIntro")}
        </Typography>

        <Input
          label={t("templates.fields.name")}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <KeyField kind={row.kind} value={key} onChange={setKey} />

        {formError ? <AlertError message={m(formError)} /> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button onClick={() => void save()} disabled={!canSave}>
            {t("templates.duplicate")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
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
