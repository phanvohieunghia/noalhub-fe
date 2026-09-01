import { useTranslations } from "next-intl";

import { Typography } from "@noalhub/ui/typography";

export function ConversationListEmpty() {
  const t = useTranslations("web.chat.sidebar");

  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center">
      <Typography variant="title-4">{t("empty")}</Typography>
      <Typography variant="body-4" className="opacity-60">
        {t("emptyHint")}
      </Typography>
    </div>
  );
}
