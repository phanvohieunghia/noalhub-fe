"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  storybookAccessFormSchema,
  useGrantStorybookAccess,
  useRevokeStorybookAccess,
  useStorybookAccess,
  type StorybookAccess,
  type StorybookAccessFormValues,
} from "@noalhub/api/admin";
import { STORYBOOK_INTERNAL_URL } from "@noalhub/api/config";
import type { Message } from "@noalhub/api/message";
import { storybookErrorText } from "@noalhub/core/admin/storybook-error-message";
import { applyApiError } from "@noalhub/core/forms/apply-api-error";
import { useDateFormat } from "@noalhub/i18n/use-date-format";
import { useMessage } from "@noalhub/i18n/use-message";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { Input } from "@noalhub/ui/input";
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
import { AlertError } from "@noalhub/ui/alert";
import { Typography } from "@noalhub/ui/typography";
import { useTranslations } from "next-intl";

import { AdminErrorState } from "../admin-error-state";

const FIELDS = ["email", "note"] as const;
const COLUMN_COUNT = 4;

/**
 * Who may open the internal Storybook.
 *
 * The screen carries two warnings that are not decoration — both describe ways
 * this list quietly fails to mean what it looks like:
 *
 * 1. **Admins are not listed.** The backend unions this table with every
 *    `role = "admin"` account, so an empty table does not mean a locked door.
 * 2. **The email must be their GOOGLE address.** The match happens against
 *    whatever Google reports at sign-in, never against their Noalhub account —
 *    a colleague whose app account is `a@congty.com` but who signs in with
 *    `b@gmail.com` is refused, and the 403 gives no hint why.
 *
 * There is no edit path on purpose: an email is the identity itself, so
 * "editing" one is revoking one person and granting another.
 */
export function StorybookAccessContent() {
  const t = useTranslations("admin.storybook");
  const access = useStorybookAccess();
  const [adding, setAdding] = useState(false);
  const [revoking, setRevoking] = useState<StorybookAccess | null>(null);

  const rows = access.data ?? [];

  return (
    <main className="w-full p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <Typography variant="h4" as="h1">
            {t("title")}
          </Typography>
          <Typography variant="body-3" className="mt-1 opacity-70">
            {t("intro", { url: STORYBOOK_INTERNAL_URL })}
          </Typography>
        </div>
        <Button onClick={() => setAdding(true)}>{t("add")}</Button>
      </div>

      <Typography
        variant="body-3"
        className="mt-4 rounded-md border border-black/10 bg-black/3 px-3 py-2 opacity-80 dark:border-white/15 dark:bg-white/5"
      >
        {t("adminsNote")}
      </Typography>

      {access.isError ? (
        <div className="mt-4">
          <AdminErrorState error={access.error} onRetry={() => access.refetch()} />
        </div>
      ) : (
        <div className="mt-4">
          <TableRoot caption={t("caption")}>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t("columns.email")}</TableHeaderCell>
                <TableHeaderCell>{t("columns.note")}</TableHeaderCell>
                <TableHeaderCell>{t("columns.grantedAt")}</TableHeaderCell>
                <TableHeaderCell>
                  <span className="sr-only">{t("actionsColumn")}</span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {access.isPending ? (
                <SkeletonRows />
              ) : rows.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>{t("empty")}</TableEmptyRow>
              ) : (
                rows.map((row) => (
                  <AccessRow key={row.id} row={row} onRevoke={() => setRevoking(row)} />
                ))
              )}
            </TableBody>
          </TableRoot>
        </div>
      )}

      {adding ? <GrantDialog onClose={() => setAdding(false)} /> : null}

      {revoking ? (
        <RevokeDialog row={revoking} onClose={() => setRevoking(null)} />
      ) : null}
    </main>
  );
}

function AccessRow({ row, onRevoke }: { row: StorybookAccess; onRevoke: () => void }) {
  const t = useTranslations("admin.storybook");
  const df = useDateFormat();

  return (
    <TableRow>
      <TableCell className="font-medium">{row.email}</TableCell>
      <TableCell className="opacity-70">{row.note ?? "—"}</TableCell>
      <TableCell className="whitespace-nowrap opacity-70">
        {df.date(row.createdAt)}
      </TableCell>
      <TableCell>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onRevoke}>
            {t("revoke")}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function GrantDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("admin.storybook");
  const tc = useTranslations("common");
  const m = useMessage();
  const grant = useGrantStorybookAccess();
  const [formError, setFormError] = useState<Message | string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StorybookAccessFormValues>({
    resolver: zodResolver(storybookAccessFormSchema),
    defaultValues: { email: "", note: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await grant.mutateAsync(values);
      onClose();
    } catch (error) {
      // 409 lands on the email field via `applyApiError` when the backend names
      // it; anything else falls back to the sentence under the form.
      setFormError(applyApiError(error, setError, FIELDS, storybookErrorText));
    }
  });

  return (
    <Dialog open onClose={onClose} title={t("addTitle")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label={t("emailLabel")}
          type="email"
          autoComplete="off"
          placeholder={t("emailPlaceholder")}
          {...register("email")}
          error={m(errors.email?.message)}
        />

        {/*
          Not a nicety: the address here is matched against what GOOGLE reports
          at sign-in. Get it wrong and the person hits a 403 that says nothing
          about which of their two addresses was the problem.
        */}
        <Typography
          variant="body-3"
          role="note"
          className="-mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-300"
        >
          {t("emailWarning")}
        </Typography>

        <Input label={t("noteLabel")} {...register("note")} error={m(errors.note?.message)} />
        <Typography variant="body-4" className="-mt-2 opacity-60">
          {t("noteHint")}
        </Typography>

        <AlertError message={m(formError)} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("granting") : t("grant")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function RevokeDialog({ row, onClose }: { row: StorybookAccess; onClose: () => void }) {
  const t = useTranslations("admin.storybook");
  const tc = useTranslations("common");
  const m = useMessage();
  const revoke = useRevokeStorybookAccess();
  const [error, setError] = useState<Message | string | null>(null);

  return (
    <Dialog open onClose={onClose} title={t("revokeTitle", { email: row.email })}>
      <div className="flex flex-col gap-4">
        <Typography variant="body-3" className="opacity-80">
          {t("revokeBody")}
        </Typography>

        <AlertError message={m(error)} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("actions.cancel")}
          </Button>
          <Button
            disabled={revoke.isPending}
            onClick={async () => {
              setError(null);
              try {
                await revoke.mutateAsync(row.id);
                onClose();
              } catch (cause) {
                setError(storybookErrorText(cause));
              }
            }}
          >
            {revoke.isPending ? tc("states.deleting") : t("revoke")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <TableRow key={index} aria-busy="true">
          {Array.from({ length: COLUMN_COUNT }).map((__, cell) => (
            <TableCell key={cell}>
              <Skeleton className="h-4 w-full max-w-32" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
