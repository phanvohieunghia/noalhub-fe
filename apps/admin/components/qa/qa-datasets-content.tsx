"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import {
  useCreateQaDataset,
  useDeleteQaDataset,
  useQaDatasets,
  type QaDataset,
  type QaDatasetStatus,
} from "@noalhub/api/qa";
import type { Message } from "@noalhub/api/message";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useMessage } from "@noalhub/i18n/use-message";
import { AlertError } from "@noalhub/ui/alert";
import { Badge, type BadgeTone } from "@noalhub/ui/badge";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { DropdownMenuItem } from "@noalhub/ui/dropdown-menu";
import { ICONS } from "@noalhub/ui/icons";
import { Input } from "@noalhub/ui/input";
import { Skeleton } from "@noalhub/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableActionsHeaderCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TableRoot,
  TableRow,
  TableRowActions,
} from "@noalhub/ui/table";
import { Typography } from "@noalhub/ui/typography";

import { AdminErrorState } from "../admin-error-state";

const COLUMN_COUNT = 6;

/**
 * `status` is the FURTHEST STAGE REACHED, not the current state, and it only
 * moves forward — deleting the last source does not take "outlined" back to
 * "ready". The labels say "has an outline", never "is being outlined", because
 * the column answers "how far did this get", not "what is happening now".
 */
const STATUS_TONES: Record<QaDatasetStatus, BadgeTone> = {
  draft: "neutral",
  ready: "info",
  outlined: "success",
  archived: "warning",
};

export function QaDatasetsContent() {
  const t = useTranslations("admin.qa");
  const datasets = useQaDatasets();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<QaDataset | null>(null);

  const rows = datasets.data ?? [];

  return (
    <main className="w-full p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <Typography variant="h4" as="h1">
            {t("datasets.title")}
          </Typography>
          <Typography variant="body-3" className="mt-1 opacity-70">
            {t("datasets.intro")}
          </Typography>
        </div>
        <Button onClick={() => setCreating(true)}>{t("datasets.add")}</Button>
      </div>

      {datasets.isError ? (
        <div className="mt-4">
          <AdminErrorState error={datasets.error} onRetry={() => datasets.refetch()} />
        </div>
      ) : (
        <div className="mt-4">
          <TableRoot caption={t("datasets.caption")}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("datasets.columns.title")}</TableHeaderCell>
                <TableHeaderCell>{t("datasets.columns.status")}</TableHeaderCell>
                <TableHeaderCell>{t("datasets.columns.chars")}</TableHeaderCell>
                <TableHeaderCell>{t("datasets.columns.updated")}</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">{t("datasets.open")}</span>
                </TableHeaderCell>
                <TableActionsHeaderCell label={t("actionsColumn")} />
              </TableRow>
            </TableHead>
            <TableBody>
              {datasets.isPending ? (
                <SkeletonRows />
              ) : rows.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>
                  {t("datasets.empty")}
                </TableEmptyRow>
              ) : (
                rows.map((row) => (
                  <DatasetRow key={row.id} row={row} onDelete={() => setDeleting(row)} />
                ))
              )}
            </TableBody>
          </TableRoot>
        </div>
      )}

      {creating ? <CreateDialog onClose={() => setCreating(false)} /> : null}
      {deleting ? (
        <DeleteDialog row={deleting} onClose={() => setDeleting(null)} />
      ) : null}
    </main>
  );
}

function DatasetRow({ row, onDelete }: { row: QaDataset; onDelete: () => void }) {
  const t = useTranslations("admin.qa");
  const df = useDateFormat();

  return (
    <TableRow>
      <TableCell weight={500}>
        <Link href={`/qa/datasets/${row.id}`} className="hover:underline">
          {row.title}
        </Link>
        {row.description ? (
          <Typography variant="body-4" as="span" className="block opacity-60">
            {row.description}
          </Typography>
        ) : null}
      </TableCell>
      <TableCell>
        <Badge tone={STATUS_TONES[row.status]}>
          {t(`datasets.status.${row.status}`)}
        </Badge>
      </TableCell>
      <TableCell className="opacity-70">
        {t("datasets.chars", { count: row.sourceCharCount })}
        {row.sourceCharWarning ? (
          <Badge tone="warning" className="ml-2">
            {t("datasets.large")}
          </Badge>
        ) : null}
      </TableCell>
      <TableCell className="whitespace-nowrap opacity-70">
        {df.date(row.updatedAt)}
      </TableCell>
      <TableCell>
        <div className="flex justify-end">
          {/* `asChild` so the anchor IS the button — a <button> wrapping an
              <a> is invalid HTML and loses keyboard navigation. */}
          <Button variant="outline" asChild>
            <Link href={`/qa/datasets/${row.id}`}>{t("datasets.open")}</Link>
          </Button>
        </div>
      </TableCell>
      <TableRowActions label={t("actionsColumn")}>
        <DropdownMenuItem icon={ICONS.delete} tone="danger" onSelect={onDelete}>
          {t("datasets.delete")}
        </DropdownMenuItem>
      </TableRowActions>
    </TableRow>
  );
}

function CreateDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const m = useMessage();
  const create = useCreateQaDataset();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<Message | string | null>(null);

  const save = async () => {
    setFormError(null);
    try {
      await create.mutateAsync({
        title,
        description: description === "" ? null : description,
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
      title={t("datasets.addTitle")}
    >
      <div className="space-y-4">
        <Input
          label={t("datasets.fields.title")}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Input
          label={t("datasets.fields.description")}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        {formError ? <AlertError message={m(formError)} /> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button
            onClick={() => void save()}
            disabled={create.isPending || title === ""}
          >
            {tc("actions.save")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function DeleteDialog({ row, onClose }: { row: QaDataset; onClose: () => void }) {
  const t = useTranslations("admin.qa");
  const tc = useTranslations("common");
  const m = useMessage();
  const remove = useDeleteQaDataset();
  const [formError, setFormError] = useState<Message | string | null>(null);

  const confirm = async () => {
    setFormError(null);
    try {
      await remove.mutateAsync(row.id);
      onClose();
    } catch (error) {
      // Once a set has been generated the backend answers 409
      // QA_DATASET_IN_USE; its message is shown as-is.
      setFormError(applyApiError(error, () => undefined, []));
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={t("datasets.deleteTitle", { title: row.title })}
    >
      <div className="space-y-4">
        <Typography variant="body-3">{t("datasets.deleteBody")}</Typography>
        {formError ? <AlertError message={m(formError)} /> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={() => void confirm()}
            disabled={remove.isPending}
          >
            {t("datasets.delete")}
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
