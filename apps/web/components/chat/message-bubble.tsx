"use client";

import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";

import { Button } from "@noalhub/ui/button";
import { Spinner } from "@noalhub/ui/spinner";
import { MessageBody } from "./message-body";
import { ReadReceipt } from "./read-receipt";
import { useChatFormat } from "./use-chat-format";
import { ackErrorText } from "@noalhub/core/chat/error-message";
import type { ConversationMember, Message } from "@noalhub/api/chat";
import { Typography } from "@noalhub/ui/typography";

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
      <Typography
        as="div"
        variant="body-3"
        className={`max-w-[min(32rem,80%)] rounded-2xl px-3 py-2 ${
          mine ? "bg-foreground text-background" : "bg-black/[0.06] dark:bg-white/10"
        } ${sending ? "opacity-60" : ""} ${failed ? "ring-1 ring-red-500" : ""}`}
      >
        <MessageBody body={message.body} />
      </Typography>

      <div className="mt-0.5 flex items-center gap-1.5 px-1 opacity-60">
        <Typography as="time" variant="body-4" dateTime={message.createdAt}>
          {cf.messageTime(message.createdAt)}
        </Typography>
        {sending ? <Spinner className="size-3" /> : null}
        {mine && message.status === "sent" ? (
          <ReadReceipt messageId={message.id} members={members} currentUserId={currentUserId} />
        ) : null}
      </div>

      {failed ? (
        <div className="mt-0.5 flex items-center gap-2 px-1">
          <Typography
            as="span"
            variant="body-4"
            role="alert"
            className="text-red-600 dark:text-red-400"
          >
            {m(ackErrorText(message.errorCode))}
          </Typography>
          {/* A resend uses the SAME `id` — the backend is idempotent on id, so a
              retry never creates a second message. */}
          <Button variant="link" size="inline" onClick={() => onRetry(message)}>
            {t("resend")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
