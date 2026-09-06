"use client";

import { usePresence } from "@noalhub/api/chat";
import { useTranslations } from "next-intl";

import { Typography } from "@noalhub/ui/typography";

import { useChatFormat } from "./use-chat-format";

/**
 * The status dot. TWO states, online and offline.
 *
 * The store can hold no entry for a user at all — presence is only broadcast to
 * people who share a conversation, and the conversation list only carries
 * `status` for DMs. That absence is rendered as **offline**: the product decides
 * that "we have not heard from them" and "they are away" are the same thing to a
 * reader, so there is no third dot.
 *
 * The cost, written down so it is not rediscovered as a bug: someone who is
 * genuinely online reads as offline until the first `presence:changed` arrives
 * (`presence:changed` fires on a CHANGE, so the REST seed in `useSeedPresence`
 * is what normally fills this in).
 *
 * Color alone communicates nothing → always paired with `title` + `sr-only`.
 */
export function PresenceDot({
  userId,
  className = "",
}: {
  userId: string | null | undefined;
  className?: string;
}) {
  const t = useTranslations("web.chat.presence");
  const cf = useChatFormat();
  const presence = usePresence(userId);

  const online = presence?.status === "online";

  const label = online
    ? t("online")
    : (cf.lastSeenLabel(presence?.lastSeenAt ?? null) ?? t("offline"));

  const color = online ? "bg-green-500" : "bg-black/25 dark:bg-white/30";

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span title={label} className={`size-2.5 rounded-full ring-2 ring-background ${color}`} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * The status text for `ChatHeader` — the same data source, and the same two
 * states, as the dot.
 *
 * No `null` return for "no data": that used to leave the header with a missing
 * second line, so the title jumped a few pixels the moment presence arrived.
 * With two states there is always a label.
 */
export function PresenceLabel({ userId }: { userId: string | null | undefined }) {
  const t = useTranslations("web.chat.presence");
  const cf = useChatFormat();
  const presence = usePresence(userId);

  const label =
    presence?.status === "online"
      ? t("online")
      : (cf.lastSeenLabel(presence?.lastSeenAt ?? null) ?? t("offline"));

  return (
    <Typography variant="body-4" as="span" className="opacity-60">
      {label}
    </Typography>
  );
}
