"use client";

import { useTranslations } from "next-intl";

/**
 * Lọc CLIENT-SIDE danh sách đã tải — backend chưa có endpoint tìm kiếm hội
 * thoại. Nghĩa là nó không tìm được hội thoại nằm ở trang chưa tải; đó là giới
 * hạn đã biết, không phải bug.
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
