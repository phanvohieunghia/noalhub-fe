"use client";

import { useTranslations } from "next-intl";

import { Spinner } from "@noalhub/ui/spinner";
import { useChatRealtime } from "./chat-realtime-provider";

/**
 * Chỉ hiện khi socket KHÔNG online. Gửi tin đi qua socket nên mất kết nối là
 * mất khả năng gửi — người dùng phải thấy điều đó, không phải đoán.
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
        <button
          type="button"
          onClick={reconnect}
          className="rounded-md border border-current/30 px-2 py-0.5 text-body-4 font-medium hover:bg-current/10"
        >
          {tc("actions.retry")}
        </button>
      )}
    </div>
  );
}
