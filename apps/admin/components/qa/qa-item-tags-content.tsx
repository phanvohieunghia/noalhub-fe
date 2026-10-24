"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import {
  QA_TAG_TONES,
  createItemTagSchema,
  useCreateQaItemTag,
  useQaItemTags,
  useUpdateQaItemTag,
  type QaItemTag,
  type QaTagTone,
} from "@noalhub/api/qa";
import type { Message } from "@noalhub/api/message";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError, AlertWarning } from "@noalhub/ui/alert";
import { Badge } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { DropdownMenuItem } from "@noalhub/ui/dropdown-menu";
import { ICONS, LUCIDE } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";
import { Select } from "@noalhub/ui/select";
import { Skeleton } from "@noalhub/ui/skeleton";
import { Switch } from "@noalhub/ui/switch";
import {
  TableActionsHeaderCell,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
  TableRowActions,
} from "@noalhub/ui/table";
import { pickTagLabel } from "@noalhub/ui/tag-mark";
import { Textarea } from "@noalhub/ui/textarea";
import { toast } from "@noalhub/ui/toast";
import { Typography } from "@noalhub/ui/typography";

import { AdminErrorState } from "../admin-error-state";

const COLUMN_COUNT = 4;
const LUCIDE_NAMES: ReadonlySet<string> = new Set(Object.values(LUCIDE));

/**
 * The catalogue of question tags (`qa_item_tags`), e.g. "Critical question".
 *
 * `key` can be renamed: questions store the tag's `id`, so no question is touched. What
 * goes stale is anything that names the old key — saved prompts, queued jobs — which is
 * why the form warns on rename. There is no delete: questions hold tag ids in an array with no foreign
 * key, so a deleted tag would leave dangling ids on every question it was attached to.
 * Switch it off to retire it.
 */
export function QaItemTagsContent() {
  const t = useTranslations("admin.qa");
  const locale = useLocale();
  const tags = useQaItemTags();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<QaItemTag | null>(null);

  const rows = tags.data ?? [];

  return (
    <main className="w-full p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <Typography variant="h4" as="h1">
            {t("tags.title")}
          </Typography>
          <Typography variant="body-3" className="mt-1 opacity-70">
            {t("tags.intro")}
          </Typography>
        </div>
        <Button onClick={() => setAdding(true)}>{t("tags.add")}</Button>
      </div>

      {tags.isError ? (
        <div className="mt-4">
          <AdminErrorState error={tags.error} onRetry={() => tags.refetch()} />
        </div>
      ) : (
        <div className="mt-4">
          <TableRoot caption={t("tags.caption")}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("tags.columns.tag")}</TableHeaderCell>
                <TableHeaderCell>{t("tags.columns.description")}</TableHeaderCell>
                <TableHeaderCell>{t("tags.columns.active")}</TableHeaderCell>
                <TableActionsHeaderCell label={t("actionsColumn")} />
              </TableRow>
            </TableHead>
            <TableBody>
              {tags.isPending ? (
                <SkeletonRows />
              ) : rows.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>{t("tags.empty")}</TableEmptyRow>
              ) : (
                rows.map((row) => (
                  <TagRow key={row.id} row={row} locale={locale} onEdit={() => setEditing(row)} />
                ))
              )}
            </TableBody>
          </TableRoot>
        </div>
      )}

      {adding ? <TagDialog onClose={() => setAdding(false)} /> : null}
      {editing ? <TagDialog row={editing} onClose={() => setEditing(null)} /> : null}
    </main>
  );
}

function tagLabel(row: QaItemTag, locale: string) {
  return pickTagLabel(row.meta.label, locale, row.key);
}

function TagRow({
  row,
  locale,
  onEdit,
}: {
  row: QaItemTag;
  locale: string;
  onEdit: () => void;
}) {
  const t = useTranslations("admin.qa");
  const update = useUpdateQaItemTag(row.id);
  const label = tagLabel(row, locale);

  return (
    <TableRow className={row.active ? undefined : "opacity-50"} onActivate={onEdit}>
      <TableCell weight={500}>
        {label}
        <Typography variant="body-4" as="div" className="font-mono opacity-60">
          {row.key}
        </Typography>
      </TableCell>
      <TableCell className="max-w-md opacity-70">
        <span className="line-clamp-2">{row.description}</span>
      </TableCell>
      {/* Stops here so flipping the switch does not also open the edit dialog. */}
      <TableCell
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <Switch
          aria-label={t("tags.toggleRow", { name: label })}
          checked={row.active}
          loading={update.isPending}
          onCheckedChange={(active) =>
            update.mutate(
              { active },
              {
                onSuccess: () => toast.success(t("tags.saved")),
                onError: () => toast.error(t("tags.saveFailed")),
              },
            )
          }
        />
        {row.active ? null : (
          <Badge tone="neutral" className="ml-2">
            {t("tags.disabled")}
          </Badge>
        )}
      </TableCell>
      <TableRowActions label={t("actionsColumn")}>
        <DropdownMenuItem icon={ICONS.edit} onSelect={onEdit}>
          {t("tags.edit")}
        </DropdownMenuItem>
      </TableRowActions>
    </TableRow>
  );
}

/** Create (no `row`) and edit (`row`) share one form. */
function TagDialog({ row, onClose }: { row?: QaItemTag; onClose: () => void }) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const m = useMessage();
  const create = useCreateQaItemTag();
  const update = useUpdateQaItemTag(row?.id ?? "");
  const [formError, setFormError] = useState<Message | string | null>(null);

  const [key, setKey] = useState(row?.key ?? "");
  const [description, setDescription] = useState(row?.description ?? "");
  const [icon, setIcon] = useState(row?.meta.icon ?? "lucide:info");
  const [tone, setTone] = useState<QaTagTone>((row?.meta.tone as QaTagTone | undefined) ?? "danger");
  const [labelVi, setLabelVi] = useState(row?.meta.label.vi ?? "");
  const [labelEn, setLabelEn] = useState(row?.meta.label.en ?? "");
  const [touched, setTouched] = useState(false);

  const payload = {
    key,
    description,
    meta: { icon, tone, label: { vi: labelVi, en: labelEn } },
  };
  // `key` is checked against the same rule the wire schema uses. The icon is checked
  // against the bundle, not just a pattern: an unknown name passes the pattern and then
  // renders nothing.
  const keyInvalid = !createItemTagSchema.shape.key.safeParse(key).success;
  const descriptionInvalid = description.trim() === "" || description.length > 640;
  const iconInvalid = !LUCIDE_NAMES.has(icon);
  const labelViInvalid = labelVi.trim() === "" || labelVi.length > 80;
  const labelEnInvalid = labelEn.trim() === "" || labelEn.length > 80;
  const valid =
    !keyInvalid && !descriptionInvalid && !iconInvalid && !labelViInvalid && !labelEnInvalid;

  const save = async () => {
    setTouched(true);
    setFormError(null);
    if (!valid) return;
    try {
      if (row) {
        await update.mutateAsync({ key, description, meta: payload.meta });
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      // QA_ITEM_TAG_DUPLICATE and VALIDATION_FAILED arrive with a readable message.
      setFormError(applyApiError(error, () => undefined, []));
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={row ? t("tags.editTitle", { label: row.meta.label.en ?? row.key }) : t("tags.addTitle")}
    >
      <div className="space-y-4">
        <Input
          label={t("tags.fields.key")}
          hint={t("tags.fields.keyHint")}
          value={key}
          maxLength={32}
          onChange={(event) => setKey(event.target.value)}
          error={touched && keyInvalid ? t("tags.fields.keyInvalid") : undefined}
        />
        {row !== undefined && key !== row.key ? (
          <AlertWarning message={t("tags.fields.keyRenameWarning")} />
        ) : null}
        <Textarea
          label={t("tags.fields.description")}
          value={description}
          maxLength={640}
          rows={4}
          onChange={(event) => setDescription(event.target.value)}
          error={touched && descriptionInvalid ? t("tags.fields.descriptionInvalid") : undefined}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("tags.fields.labelVi")}
            value={labelVi}
            maxLength={80}
            onChange={(event) => setLabelVi(event.target.value)}
            error={touched && labelViInvalid ? t("tags.fields.labelInvalid") : undefined}
          />
          <Input
            label={t("tags.fields.labelEn")}
            value={labelEn}
            maxLength={80}
            onChange={(event) => setLabelEn(event.target.value)}
            error={touched && labelEnInvalid ? t("tags.fields.labelInvalid") : undefined}
          />
        </div>
        <Select
          label={t("tags.fields.tone")}
          value={tone}
          onChange={(event) => setTone(event.target.value as QaTagTone)}
          options={QA_TAG_TONES.map((value) => ({
            value,
            label: t(`tags.tones.${value}`),
          }))}
        />
        <Input
          label={t("tags.fields.icon")}
          hint={t("tags.fields.iconHint")}
          value={icon}
          maxLength={64}
          onChange={(event) => setIcon(event.target.value)}
          error={touched && iconInvalid ? t("tags.fields.iconInvalid") : undefined}
        />
        {formError ? <AlertError message={m(formError)} /> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button onClick={() => void save()} loading={create.isPending || update.isPending}>
            {tc("actions.save")}
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
