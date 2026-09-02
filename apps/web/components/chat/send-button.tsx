"use client";

import { Spinner } from "@noalhub/ui/spinner";

export function SendButton({ disabled, pending }: { disabled: boolean; pending: boolean }) {
  return (
    // A real `type="submit"`, so the form can be sent from the keyboard and not
    // only with the mouse.
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
