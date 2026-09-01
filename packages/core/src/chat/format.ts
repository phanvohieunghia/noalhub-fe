import { isThisYear, isToday, isYesterday } from "date-fns";

import type { Conversation, ConversationMember } from "@noalhub/api/chat";

/**
 * Phần **tính toán** của hiển thị chat. Không có chuỗi người dùng đọc nào ở
 * đây: file này là module cấp app, nạp một lần lúc import, nên nó không biết
 * locale nào cả (`docs/i18n-plan.md` §7.3).
 *
 * Chữ và định dạng ngày nằm ở `useChatFormat()` trong `apps/web` — nó cầm cả
 * `t` lẫn locale, và gọi đúng những hàm dưới đây.
 */

/**
 * Tên hội thoại, hoặc `null` nếu phải rơi về nhãn mặc định.
 *
 * DM (`type: "direct"`) không có `title` — tên lấy từ thành viên CÒN LẠI, nên
 * hàm này cần biết ai là mình. Logic này xuất hiện ở sidebar, header, tab title
 * nên viết một lần ở đây.
 *
 * `null` có hai nghĩa khác nhau mà chỗ gọi phải phân biệt, nên trả kèm `kind`:
 * DM không rõ tên người kia thì hiện "Người dùng", còn group không tên thì hiện
 * "Nhóm không tên".
 */
export function conversationName(
  conversation: Conversation,
  currentUserId: string | null,
): { name: string } | { fallback: "user" | "group" | "conversation" } {
  if (conversation.title) return { name: conversation.title };

  const other = otherMember(conversation, currentUserId);
  if (other) {
    return other.displayName ? { name: other.displayName } : { fallback: "user" };
  }

  // DM với chính mình, hoặc members rỗng vì lý do nào đó.
  return { fallback: conversation.type === "group" ? "group" : "conversation" };
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

/**
 * Ngày của một mốc thời gian, đã quy về ba nhóm mà giao diện cần phân biệt.
 * `date` là `Date` đã parse để chỗ gọi khỏi parse lần nữa.
 */
export type DayKind =
  | { kind: "invalid" }
  | { kind: "today"; date: Date }
  | { kind: "yesterday"; date: Date }
  | { kind: "date"; date: Date; thisYear: boolean };

export function dayKind(iso: string | null): DayKind {
  if (!iso) return { kind: "invalid" };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { kind: "invalid" };
  if (isToday(date)) return { kind: "today", date };
  if (isYesterday(date)) return { kind: "yesterday", date };
  return { kind: "date", date, thisYear: isThisYear(date) };
}

/**
 * "Hoạt động 3 giờ trước" — chỉ có khi người đó offline.
 *
 * Trả về đơn vị + con số, không trả câu: số nhiều và trật tự từ khác nhau giữa
 * các ngôn ngữ, ghép chuỗi ở đây là ghép sai ở ngôn ngữ thứ hai (§7.2).
 */
export type LastSeen =
  | { kind: "unknown" }
  | { kind: "justNow" }
  | { kind: "minutes"; value: number }
  | { kind: "hours"; value: number }
  | { kind: "days"; value: number }
  | { kind: "date"; date: Date };

export function lastSeen(iso: string | null): LastSeen {
  if (!iso) return { kind: "unknown" };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { kind: "unknown" };

  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return { kind: "justNow" };
  if (minutes < 60) return { kind: "minutes", value: minutes };

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { kind: "hours", value: hours };

  const days = Math.floor(hours / 24);
  if (days < 7) return { kind: "days", value: days };
  return { kind: "date", date };
}

/** Hai tin cùng người, cách nhau dưới 5 phút thì gộp một nhóm. */
export const GROUP_WINDOW_MS = 5 * 60_000;

/** Hai ISO string có cùng ngày dương lịch? */
export function isSameDay(a: string, b: string): boolean {
  const left = new Date(a);
  const right = new Date(b);
  if (Number.isNaN(left.getTime()) || Number.isNaN(right.getTime())) return false;
  return left.toDateString() === right.toDateString();
}
