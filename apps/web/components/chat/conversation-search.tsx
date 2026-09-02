"use client";

import { useTranslations } from "next-intl";

/**
 * CLIENT-SIDE filtering of what is already loaded — the backend has no
 * conversation search endpoint. That means it cannot find a conversation on a
 * page not yet fetched; a known limitation, not a bug.
 */
export function ConversationSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("web.chat.sidebar");

  return (
    <div className="shrink-0 px-2 pb-2">
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchLabel")}
        className="w-full rounded-md border border-black/15 bg-transparent px-3 py-1.5 text-body-3 outline-none focus:border-foreground/60 dark:border-white/20"
      />
    </div>
  );
}
