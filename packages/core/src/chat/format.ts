import { isThisYear, isToday, isYesterday } from "date-fns";

import type { Conversation, ConversationMember } from "@noalhub/api/chat";

/**
 * The **computation** behind chat's display. No user-facing strings live here:
 * this is an app-level module loaded once at import time, so it knows no locale
 * at all (`docs/i18n.md` §7.3).
 *
 * The words and the date formatting live in `useChatFormat()` inside
 * `apps/web` — it holds both `t` and the locale, and calls the functions below.
 */

/**
 * The conversation's name, or a fallback label to use instead.
 *
 * A DM (`type: "direct"`) has no `title` — its name comes from the OTHER
 * member, so this function needs to know who "me" is. The same logic appears in
 * the sidebar, the header and the tab title, so it is written once here.
 *
 * The fallback carries a `kind` because the call site has to tell two cases
 * apart: a DM whose other member has no name shows "User", while an unnamed
 * group shows "Unnamed group".
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

  // A DM with yourself, or an empty member list for some reason.
  return { fallback: conversation.type === "group" ? "group" : "conversation" };
}

/** The other member of a DM. `undefined` for a group. */
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
 * A timestamp's day, reduced to the three groups the UI needs to tell apart.
 * `date` is the already-parsed `Date`, so the call site need not parse again.
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
 * "Active 3 hours ago" — only shown while that person is offline.
 *
 * Returns a unit plus a number, never a sentence: plurals and word order differ
 * between languages, so assembling the string here would be wrong in the second
 * language (§7.2).
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

/** Two messages from the same person less than 5 minutes apart are grouped. */
export const GROUP_WINDOW_MS = 5 * 60_000;

/** Do two ISO strings fall on the same calendar day? */
export function isSameDay(a: string, b: string): boolean {
  const left = new Date(a);
  const right = new Date(b);
  if (Number.isNaN(left.getTime()) || Number.isNaN(right.getTime())) return false;
  return left.toDateString() === right.toDateString();
}
