"use client";

import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";

import { Spinner } from "@noalhub/ui/spinner";
import { MessageBody } from "./message-body";
import { ReadReceipt } from "./read-receipt";
import { useChatFormat } from "./use-chat-format";
import { ackErrorText } from "@noalhub/core/chat/error-message";
import type { ConversationMember, Message } from "@noalhub/api/chat";

export function MessageBubble({
  message,
  mine,
  members,
  currentUserId,
  onRetry,
}: {
  message: Message;
  mine: boolean;
  members: ConversationMember[];
  currentUserId: string | null;
  onRetry: (message: Message) => void;
}) {
  const t = useTranslations("web.chat.messages");
  const m = useMessage();
  const cf = useChatFormat();
  const failed = message.status === "failed";
  const sending = message.status === "sending";

  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[min(32rem,80%)] rounded-2xl px-3 py-2 text-body-3 ${
          mine ? "bg-foreground text-background" : "bg-black/[0.06] dark:bg-white/10"
        } ${sending ? "opacity-60" : ""} ${failed ? "ring-1 ring-red-500" : ""}`}
      >
        <MessageBody body={message.body} />
      </div>

      <div className="mt-0.5 flex items-center gap-1.5 px-1 text-[11px] opacity-60">
        <time dateTime={message.createdAt}>{cf.messageTime(message.createdAt)}</time>
        {sending ? <Spinner className="size-3" /> : null}
        {mine && message.status === "sent" ? (
          <ReadReceipt messageId={message.id} members={members} currentUserId={currentUserId} />
        ) : null}
      </div>

      {failed ? (
        <div className="mt-0.5 flex items-center gap-2 px-1">
          <span role="alert" className="text-[11px] text-red-600 dark:text-red-400">
            {m(ackErrorText(message.errorCode))}
          </span>
          {/* A resend uses the SAME `id` — the backend is idempotent on id, so a
              retry never creates a second message. */}
          <button
            type="button"
            onClick={() => onRetry(message)}
            className="text-[11px] font-medium underline underline-offset-2"
          >
            {t("resend")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
