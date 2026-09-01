"use client";

import { useTranslations } from "next-intl";

import type { ConversationMember } from "@noalhub/api/chat";

/**
 * "An đang nhập…". Tự tắt sau 5s nhờ TTL trong ephemeral store — event
 * `typing:stop` được phép rơi theo thiết kế backend, nên không thể chỉ dựa vào
 * nó.
 */
export function TypingIndicator({
  userIds,
  members,
}: {
  userIds: string[];
  members: Map<string, ConversationMember>;
}) {
  // Hook phải đứng trước mọi nhánh `return` — kể cả nhánh rỗng ngay dưới.
  const t = useTranslations("web.chat.typing");
  const tm = useTranslations("web.chat.messages");

  // Giữ chiều cao cố định để bubble cuối không nhảy lên xuống mỗi lần ai đó gõ.
  if (userIds.length === 0) return <div className="h-5" />;

  const names = userIds.map((id) => members.get(id)?.displayName ?? tm("unknownUser"));

  const label =
    names.length === 1
      ? t("one", { name: names[0]! })
      : names.length === 2
        ? t("two", { first: names[0]!, second: names[1]! })
        : t("many", { first: names[0]!, count: names.length - 1 });

  return (
    <div className="text-body-4 h-5 shrink-0 px-4 opacity-60" aria-live="polite">
      {label}
    </div>
  );
}
