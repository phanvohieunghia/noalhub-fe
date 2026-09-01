"use client";

import { useState } from "react";

import type { BlogPostFormValues } from "@noalhub/api/blog";
import { blogErrorText } from "@noalhub/core/blog/error-message";
import type { Message } from "@noalhub/api/message";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import { Button } from "@noalhub/ui/button";
import { Dialog } from "@noalhub/ui/dialog";
import { FormError } from "@noalhub/ui/form-error";

import { publishChecklist } from "./publish-checklist";
import { Typography } from "@noalhub/ui/typography";

/**
 * Dialog xác nhận trước khi đăng (`docs/blog-plan.md` §7.4).
 *
 * Cùng tinh thần với dialog moderation ở `admin-plan.md` §3b: hành động nhìn
 * thấy được từ ngoài thì không cho xảy ra bằng một cú click.
 */
export function PublishDialog({
  values,
  hasUnsavedChanges,
  isPending,
  onConfirm,
  onClose,
}: {
  values: BlogPostFormValues;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
}) {
  const t = useTranslations("admin.posts.publish");
  const m = useMessage();
  const tc = useTranslations("common.actions");
  const [error, setError] = useState<Message | string | null>(null);
  const issues = publishChecklist(values, { hasUnsavedChanges });
  const blocked = issues.some((issue) => issue.blocking);

  return (
    <Dialog open onClose={onClose} title={t("dialogTitle")}>
      <div className="flex flex-col gap-4">
        <Typography variant="body-3" className="opacity-80">
          {t.rich("intro", {
            slug: values.slug,
            path: (chunks) => <strong>{chunks}</strong>,
          })}
        </Typography>

        {issues.length > 0 ? (
          <ul className="flex flex-col gap-2 text-body-3">
            {issues.map((issue) => (
              <li
                key={issue.id}
                className={`rounded-md border px-3 py-2 ${
                  issue.blocking
                    ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                }`}
              >
                {t(`issues.${issue.messageKey}` as "issues.category")}
              </li>
            ))}
          </ul>
        ) : (
          <Typography
            variant="body-3"
            className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-300"
          >
            {t("ready")}
          </Typography>
        )}

        <FormError message={m(error)} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button
            disabled={blocked || isPending}
            onClick={async () => {
              setError(null);
              try {
                await onConfirm();
                onClose();
              } catch (cause) {
                setError(blogErrorText(cause));
              }
            }}
          >
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
