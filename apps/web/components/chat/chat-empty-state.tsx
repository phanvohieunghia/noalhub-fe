import { useTranslations } from "next-intl";

import { Typography } from "@noalhub/ui/typography";

/** The right-hand pane on `/chat` when no conversation is selected yet. */
export function ChatEmptyState() {
  const t = useTranslations("web.chat.conversation");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <Typography variant="title-2" weight={500}>
        {t("emptyTitle")}
      </Typography>
      <Typography variant="body-3" className="max-w-sm opacity-60">
        {t("emptyState")}
      </Typography>
    </div>
  );
}
