"use client";

import { adminErrorText } from "@noalhub/core/admin/error-message";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import { Button } from "@noalhub/ui/button";
import { Typography } from "@noalhub/ui/typography";

/**
 * The shared error surface for every admin screen (`docs/admin-plan.md` §1).
 * Thanks to it, losing a role mid-session produces an explanation rather than a
 * blank screen.
 */
export function AdminErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const t = useTranslations("common.actions");
  const m = useMessage();

  return (
    <div
      role="alert"
      className="text-body-3 flex flex-col items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4"
    >
      <Typography variant="body-3">{m(adminErrorText(error))}</Typography>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          {t("retry")}
        </Button>
      ) : null}
    </div>
  );
}
