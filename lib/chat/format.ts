import { format, isThisYear, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";

import type { Conversation, ConversationMember } from "@/services/chat/types";

/**
 * Hiển thị tên hội thoại.
 *
 * DM (`type: "direct"`) không có `title` — tên lấy từ thành viên CÒN LẠI, nên
 * hàm này cần biết ai là mình. Logic này xuất hiện ở sidebar, header, tab title
 * nên viết một lần ở đây.
 */
export function conversationDisplayName(
  conversation: Conversation,
  currentUserId: string | null,
): string {
  if (conversation.title) return conversation.title;

  const other = otherMember(conversation, currentUserId);
  if (other) return other.displayName ?? "Người dùng";

  // DM với chính mình, hoặc members rỗng vì lý do nào đó.
  return conversation.type === "group" ? "Nhóm không tên" : "Hội thoại";
}

/** Thành viên còn lại của một DM. `undefined` với group. */
export function otherMember(
  conversation: Conversation,
  currentUserId: string | null,
): ConversationMember | undefined {
  return conversation.members.find((member) => member.userId !== currentUserId);
}

export function memberMap(
  conversation: Conversation | undefined,
): Map<string, ConversationMember> {
  const map = new Map<string, ConversationMember>();
  for (const member of conversation?.members ?? []) {
    map.set(member.userId, member);
  }
  return map;
}

/** Giờ của một tin: "14:32". */
export function messageTime(iso: string): string {
  return safeFormat(iso, "HH:mm");
}

/** Nhãn cho `DateSeparator`. */
export function dayLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (isToday(date)) return "Hôm nay";
  if (isYesterday(date)) return "Hôm qua";
  return format(date, isThisYear(date) ? "d MMMM" : "d MMMM yyyy", { locale: vi });
}

/** Timestamp cạnh mỗi hội thoại ở sidebar: giờ nếu hôm nay, còn lại là ngày. */
export function conversationTimestamp(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Hôm qua";
  return format(date, isThisYear(date) ? "d/M" : "d/M/yy");
}

/** "Hoạt động 3 giờ trước" — chỉ có khi người đó offline. */
export function lastSeenLabel(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "Vừa mới đây";
  if (minutes < 60) return `Hoạt động ${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hoạt động ${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `Hoạt động ${days} ngày trước`;
  return `Hoạt động ${format(date, "d/M/yyyy")}`;
}

/** Hai tin cùng người, cách nhau dưới 5 phút thì gộp một nhóm. */
export const GROUP_WINDOW_MS = 5 * 60_000;

function safeFormat(iso: string, pattern: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, pattern, { locale: vi });
}

/** Hai ISO string có cùng ngày dương lịch? */
export function isSameDay(a: string, b: string): boolean {
  const left = new Date(a);
  const right = new Date(b);
  if (Number.isNaN(left.getTime()) || Number.isNaN(right.getTime())) return false;
  return left.toDateString() === right.toDateString();
}
