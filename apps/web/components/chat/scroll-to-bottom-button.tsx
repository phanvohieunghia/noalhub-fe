"use client";

import { useTranslations } from "next-intl";

import { Button } from "@noalhub/ui/button";

export function ScrollToBottomButton({
  newCount,
  onClick,
}: {
  newCount: number;
  onClick: () => void;
}) {
  const t = useTranslations("web.chat.messages");

  return (
    <Button
      variant="outline"
      size="xs"
      shape="circle"
      onClick={onClick}
      className="absolute right-4 bottom-4 z-10 gap-1.5 bg-background shadow-lg"
    >
      <span aria-hidden>↓</span>
      {newCount > 0 ? t("newMessages", { count: newCount }) : t("toBottom")}
    </Button>
  );
}
