"use client";

import { useRef, useState } from "react";

import { ComposerOfflineNotice } from "./composer-offline-notice";
import { MessageTextarea } from "./message-textarea";
import { SendButton } from "./send-button";
import { useChatRealtime } from "./chat-realtime-provider";
import { MESSAGE_BODY_MAX } from "@noalhub/api/chat";
import { useTranslations } from "next-intl";
import { useSendMessage, useTyping } from "@noalhub/api/chat";
import { Typography } from "@noalhub/ui/typography";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const t = useTranslations("web.chat.composer");
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { status } = useChatRealtime();
  const { mutate: send, isPending } = useSendMessage(conversationId);
  const { start: startTyping, stop: stopTyping } = useTyping(conversationId);

  const offline = status !== "online";
  const trimmed = body.trim();
  const tooLong = trimmed.length > MESSAGE_BODY_MAX;
  const canSend = trimmed.length > 0 && !tooLong && !offline;

  function submit() {
    if (!canSend) return;

    // Clear composer NGAY, không chờ ack — tin đã vào cache dưới dạng optimistic
    // và có nút gửi lại nếu thất bại, nên không có gì để mất.
    setBody("");
    stopTyping();
    const node = textareaRef.current;
    if (node) node.style.height = "auto";

    send({ body: trimmed });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="shrink-0 border-t border-black/10 p-3 dark:border-white/10"
    >
      {offline ? <ComposerOfflineNotice /> : null}

      <div className="flex items-end gap-2">
        <MessageTextarea
          ref={textareaRef}
          value={body}
          aria-label={t("label")}
          placeholder={offline ? t("placeholderOffline") : t("placeholder")}
          // KHÔNG disable textarea khi offline: đang gõ mà bị khoá là tệ. Chỉ
          // chặn ở nút gửi, và nội dung vẫn được giữ nguyên.
          onChange={(event) => {
            setBody(event.target.value);
            if (event.target.value.trim()) startTyping();
          }}
          onBlur={stopTyping}
          onKeyDown={(event) => {
            // Enter gửi, Shift+Enter xuống dòng. Bỏ qua lúc IME đang ghép chữ,
            // nếu không tiếng Việt sẽ bị gửi giữa lúc gõ dấu.
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <SendButton disabled={!canSend} pending={isPending} />
      </div>

      {tooLong ? (
        <Typography
          variant="body-4"
          role="alert"
          className="px-1 pt-1 text-red-600 dark:text-red-400"
        >
          {t("tooLong", { max: MESSAGE_BODY_MAX, length: trimmed.length })}
        </Typography>
      ) : null}
    </form>
  );
}
