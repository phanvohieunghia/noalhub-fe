"use client";

import { adminErrorMessage } from "@noalhub/core/admin/error-message";
import { Button } from "@noalhub/ui/button";

/**
 * Chỗ hiển thị lỗi dùng chung cho mọi màn hình admin (`docs/admin-plan.md` §1).
 * Nhờ nó, mất role giữa phiên cho ra một câu giải thích thay vì màn hình trắng.
 */
export function AdminErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm"
    >
      <p>{adminErrorMessage(error)}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      ) : null}
    </div>
  );
}
