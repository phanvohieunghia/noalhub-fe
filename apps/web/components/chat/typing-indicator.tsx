"use client";

import { useTranslations } from "next-intl";

import type { ConversationMember } from "@noalhub/api/chat";

/**
 * "An is typing…". It clears itself after 5s thanks to the TTL in the ephemeral
 * store — the backend's design allows `typing:stop` to be dropped, so it cannot
 * be relied on alone.
 */
export function TypingIndicator({
  userIds,
  members,
}: {
  userIds: string[];
  members: Map<string, ConversationMember>;
}) {
  // Hooks must come before every `return` branch — including the empty one below.
  const t = useTranslations("web.chat.typing");
  const tm = useTranslations("web.chat.messages");

  // A fixed height keeps the last bubble from jumping whenever someone types.
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
