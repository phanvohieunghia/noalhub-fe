"use client";

import type { Conversation } from "@noalhub/api/chat";
import { conversationName, dayKind, lastSeen } from "@noalhub/core/chat/format";
import { DEFAULT_LOCALE, isLocale } from "@noalhub/i18n/config";
import { intlLocale } from "@noalhub/i18n/formats";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

/**
 * The **only** place that turns `@noalhub/core/chat/format`'s computations into
 * words. `t` and the `Intl.*` formatters are combined into one hook for two
 * reasons:
 *
 * 1. The same timestamp must read identically in the sidebar, the header and
 *    the profile drawer — three places assembling their own strings means three
 *    different date formats.
 * 2. `new Intl.DateTimeFormat` is expensive and the chat list calls it for
 *    **every row** on every render. `useMemo` keeps the formatters alive across
 *    renders, rebuilding them only when the language changes (`docs/i18n.md`
 *    §7.1).
 */
export function useChatFormat() {
  const t = useTranslations("web.chat");
  const locale = useLocale();
  const tag = intlLocale(isLocale(locale) ? locale : DEFAULT_LOCALE);

  const fmt = useMemo(
    () => ({
      time: new Intl.DateTimeFormat(tag, { hour: "2-digit", minute: "2-digit" }),
      dayInYear: new Intl.DateTimeFormat(tag, { day: "numeric", month: "long" }),
      fullDay: new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", year: "numeric" }),
      shortInYear: new Intl.DateTimeFormat(tag, { day: "numeric", month: "numeric" }),
      shortFull: new Intl.DateTimeFormat(tag, {
        day: "numeric",
        month: "numeric",
        year: "2-digit",
      }),
      date: new Intl.DateTimeFormat(tag, { dateStyle: "short" }),
    }),
    [tag],
  );

  return useMemo(
    () => ({
      /** The conversation's display name, already fallen back to a default label if needed. */
      conversationName(conversation: Conversation, currentUserId: string | null): string {
        const result = conversationName(conversation, currentUserId);
        if ("name" in result) return result.name;
        return t(
          result.fallback === "user"
            ? "conversation.fallbackName"
            : result.fallback === "group"
              ? "conversation.unnamedGroup"
              : "conversation.untitled",
        );
      },

      /** A message's time: "14:32". */
      messageTime(iso: string): string {
        const date = new Date(iso);
        return Number.isNaN(date.getTime()) ? "" : fmt.time.format(date);
      },

      /** The label for `DateSeparator`. */
      dayLabel(iso: string): string {
        const day = dayKind(iso);
        switch (day.kind) {
          case "invalid":
            return "";
          case "today":
            return t("day.today");
          case "yesterday":
            return t("day.yesterday");
          default:
            return (day.thisYear ? fmt.dayInYear : fmt.fullDay).format(day.date);
        }
      },

      /** The timestamp beside each conversation in the sidebar: a time if today, otherwise a date. */
      conversationTimestamp(iso: string | null): string {
        const day = dayKind(iso);
        switch (day.kind) {
          case "invalid":
            return "";
          case "today":
            return fmt.time.format(day.date);
          case "yesterday":
            return t("day.yesterday");
          default:
            return (day.thisYear ? fmt.shortInYear : fmt.shortFull).format(day.date);
        }
      },

      /** "Active 3 hours ago". `null` when there is no timestamp to speak of. */
      lastSeenLabel(iso: string | null): string | null {
        const seen = lastSeen(iso);
        switch (seen.kind) {
          case "unknown":
            return null;
          case "justNow":
            return t("presence.justNow");
          case "minutes":
            return t("presence.minutesAgo", { minutes: seen.value });
          case "hours":
            return t("presence.hoursAgo", { hours: seen.value });
          case "days":
            return t("presence.daysAgo", { days: seen.value });
          default:
            return t("presence.onDate", { date: fmt.date.format(seen.date) });
        }
      },
    }),
    [t, fmt],
  );
}
