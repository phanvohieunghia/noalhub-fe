"use client";

import { useState } from "react";

import type { BlogPostFormValues } from "@noalhub/api/blog";
import { blogErrorMessage } from "@noalhub/core/blog/error-message";
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
  const [error, setError] = useState<string | null>(null);
  const issues = publishChecklist(values, { hasUnsavedChanges });
  const blocked = issues.some((issue) => issue.blocking);

  return (
    <Dialog open onClose={onClose} title="Đăng bài này?">
      <div className="flex flex-col gap-4">
        <Typography variant="body-3" className="opacity-80">
          Đăng xong bài sẽ xuất hiện ngay ở <strong>/blogs/{values.slug}</strong> và trong sitemap.
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
                {issue.message}
              </li>
            ))}
          </ul>
        ) : (
          <Typography
            variant="body-3"
            className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-300"
          >
            Mọi thứ đã sẵn sàng.
          </Typography>
        )}

        <FormError message={error} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            disabled={blocked || isPending}
            onClick={async () => {
              setError(null);
              try {
                await onConfirm();
                onClose();
              } catch (cause) {
                setError(blogErrorMessage(cause));
              }
            }}
          >
            {isPending ? "Đang đăng…" : "Đăng bài"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
