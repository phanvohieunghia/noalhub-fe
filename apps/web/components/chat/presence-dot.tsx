"use client";

import { usePresence } from "@noalhub/api/chat";
import { useTranslations } from "next-intl";

import { Typography } from "@noalhub/ui/typography";

import { useChatFormat } from "./use-chat-format";

/**
 * The status dot. Three states, not two: the backend only broadcasts presence to
 * people who share a conversation, so "no data yet" means UNKNOWN — it must not
 * be rendered as a confident offline.
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

  const label = !presence
    ? t("unknown")
    : presence.status === "online"
      ? t("online")
      : (cf.lastSeenLabel(presence.lastSeenAt) ?? t("offline"));

  const color =
    presence?.status === "online"
      ? "bg-green-500"
      : presence
        ? "bg-black/25 dark:bg-white/30"
        : "bg-black/10 dark:bg-white/15";

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span title={label} className={`size-2.5 rounded-full ring-2 ring-background ${color}`} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** The status text for `ChatHeader` — the same data source as the dot. */
export function PresenceLabel({ userId }: { userId: string | null | undefined }) {
  const t = useTranslations("web.chat.presence");
  const cf = useChatFormat();
  const presence = usePresence(userId);
  if (!presence) return null;

  const label = presence.status === "online" ? t("online") : cf.lastSeenLabel(presence.lastSeenAt);

  if (!label) return null;
  return (
    <Typography variant="body-4" as="span" className="opacity-60">
      {label}
    </Typography>
  );
}
