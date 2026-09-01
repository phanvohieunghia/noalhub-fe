"use client";

import { adminErrorMessage } from "@noalhub/core/admin/error-message";
import { Button } from "@noalhub/ui/button";
import { Typography } from "@noalhub/ui/typography";

/**
 * Chỗ hiển thị lỗi dùng chung cho mọi màn hình admin (`docs/admin-plan.md` §1).
 * Nhờ nó, mất role giữa phiên cho ra một câu giải thích thay vì màn hình trắng.
 */
export function AdminErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="text-body-3 flex flex-col items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4"
    >
      <Typography variant="body-3">{adminErrorMessage(error)}</Typography>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      ) : null}
    </div>
  );
}
