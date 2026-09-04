"use client";

import { useTranslations } from "next-intl";

import { Button } from "@noalhub/ui/button";
import { Spinner } from "@noalhub/ui/spinner";
import { useChatRealtime } from "./chat-realtime-provider";

/**
 * Shown only while the socket is NOT online. Messages go over the socket, so a
 * lost connection means losing the ability to send — the user has to see that,
 * not guess it.
 */
export function ConnectionBanner() {
  const t = useTranslations("web.chat.connection");
  const tc = useTranslations("common");
  const { status, reconnect } = useChatRealtime();
  if (status === "online") return null;

  const connecting = status === "connecting";

  return (
    <div
      role="status"
      className="text-body-3 flex shrink-0 items-center justify-center gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-amber-800 dark:text-amber-200"
    >
      {connecting ? <Spinner /> : <span aria-hidden>⚠</span>}
      <span>
        {connecting ? t("reconnecting") : t("offline")}
      </span>
      {connecting ? null : (
        // `border-current` on purpose: the banner is amber, and a
        // `border-border` button inside it reads as a foreign element.
        <Button
          variant="outline"
          size="xs"
          onClick={reconnect}
          className="border-current/30 hover:bg-current/10"
        >
          {tc("actions.retry")}
        </Button>
      )}
    </div>
  );
}
