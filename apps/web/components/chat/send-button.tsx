"use client";

import { Spinner } from "@noalhub/ui/spinner";

export function SendButton({ disabled, pending }: { disabled: boolean; pending: boolean }) {
  return (
    // `type="submit"` thật, để form gửi được bằng bàn phím chứ không chỉ bằng
    // chuột.
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-foreground px-4 text-body-3 font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? <Spinner className="size-3.5" /> : null}
      Gửi
    </button>
  );
}
