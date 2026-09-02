"use client";

import { Typography } from "@noalhub/ui/typography";

import { useChatFormat } from "./use-chat-format";

/** "Today" / "Yesterday" / "3 July". */
export function DateSeparator({ iso }: { iso: string }) {
  const label = useChatFormat().dayLabel(iso);
  if (!label) return null;

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
      <Typography variant="body-4" as="span" className="opacity-60">
        {label}
      </Typography>
      <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
    </div>
  );
}
