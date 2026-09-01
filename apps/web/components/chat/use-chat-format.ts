"use client";

import type { Conversation } from "@noalhub/api/chat";
import { conversationName, dayKind, lastSeen } from "@noalhub/core/chat/format";
import { DEFAULT_LOCALE, isLocale } from "@noalhub/i18n/config";
import { intlLocale } from "@noalhub/i18n/formats";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

/**
 * Chỗ **duy nhất** biến kết quả tính toán của `@noalhub/core/chat/format`
 * thành chữ. Gộp `t` và các `Intl.*` formatter vào một hook vì hai lý do:
 *
 * 1. Cùng một mốc thời gian phải đọc giống hệt nhau ở sidebar, ở header và ở
 *    drawer hồ sơ — ba chỗ tự ghép chuỗi là ba cách viết ngày khác nhau.
 * 2. `new Intl.DateTimeFormat` là hàm đắt và danh sách chat gọi nó cho **từng
 *    dòng** ở mỗi lần render. `useMemo` giữ formatter sống qua các lần render,
 *    chỉ dựng lại khi đổi ngôn ngữ (`docs/i18n-plan.md` §7.1).
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
      /** Tên hiển thị của hội thoại, đã rơi về nhãn mặc định nếu cần. */
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

      /** Giờ của một tin: "14:32". */
      messageTime(iso: string): string {
        const date = new Date(iso);
        return Number.isNaN(date.getTime()) ? "" : fmt.time.format(date);
      },

      /** Nhãn cho `DateSeparator`. */
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

      /** Timestamp cạnh mỗi hội thoại ở sidebar: giờ nếu hôm nay, còn lại là ngày. */
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

      /** "Hoạt động 3 giờ trước". `null` khi không có mốc nào để nói. */
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
