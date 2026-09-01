"use client";

import { useTranslations } from "next-intl";

export function ScrollToBottomButton({
  newCount,
  onClick,
}: {
  newCount: number;
  onClick: () => void;
}) {
  const t = useTranslations("web.chat.messages");

  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-4 bottom-4 z-10 flex items-center gap-1.5 rounded-full border border-black/10 bg-background px-3 py-1.5 text-body-4 font-medium shadow-lg dark:border-white/15"
    >
      <span aria-hidden>↓</span>
      {newCount > 0 ? t("newMessages", { count: newCount }) : t("toBottom")}
    </button>
  );
}
