import { useTranslations } from "next-intl";

import { Typography } from "@noalhub/ui/typography";

/**
 * Messages are sent over the socket, so a lost connection means nothing can be
 * sent. The reason has to be stated, and so does the fact that nothing is lost —
 * a silently disabled button is the worst option here.
 */
export function ComposerOfflineNotice() {
  return (
    <Typography variant="body-4" role="status" className="px-1 pb-1 opacity-60">
      {useTranslations("web.chat.connection")("composerOffline")}
    </Typography>
  );
}
