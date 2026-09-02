import { create } from "zustand";

import type { PresenceEntry, PresenceStatus } from "./types";

/**
 * Typing and presence do NOT go into React Query: they change several times a
 * second and have no "source of truth" to refetch from. Putting them in the
 * cache would mean invalidating constantly (`docs/chat.md` §5.7).
 */

/** The backend does not persist `typing`; the client clears it after this long. */
const TYPING_TTL_MS = 5_000;

type TypingKey = `${string}:${string}`;

/** One timeout per (conversation, user) — kept outside state so it causes no re-render. */
const typingTimers = new Map<TypingKey, ReturnType<typeof setTimeout>>();

type EphemeralState = {
  /** conversationId → the list of userIds currently typing. */
  typingByConversation: Record<string, string[]>;
  /** userId → presence. Absent means UNKNOWN, not offline. */
  presenceByUser: Record<string, PresenceEntry>;

  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  setPresence: (
    userId: string,
    status: PresenceStatus,
    lastSeenAt: string | null,
  ) => void;
  clear: () => void;
};

export const useEphemeralStore = create<EphemeralState>((set, get) => ({
  typingByConversation: {},
  presenceByUser: {},

  setTyping(conversationId, userId, isTyping) {
    const key: TypingKey = `${conversationId}:${userId}`;

    const existing = typingTimers.get(key);
    if (existing) {
      clearTimeout(existing);
      typingTimers.delete(key);
    }

    set((state) => {
      const current = state.typingByConversation[conversationId] ?? [];
      const next = isTyping
        ? current.includes(userId)
          ? current
          : [...current, userId]
        : current.filter((id) => id !== userId);

      if (next === current) return state;
      return {
        typingByConversation: {
          ...state.typingByConversation,
          [conversationId]: next,
        },
      };
    });

    // TTL: without it, "typing…" hangs forever whenever a `typing:stop` event
    // is dropped — and the backend's design ALLOWS it to be dropped.
    if (isTyping) {
      const timer = setTimeout(() => {
        typingTimers.delete(key);
        get().setTyping(conversationId, userId, false);
      }, TYPING_TTL_MS);
      typingTimers.set(key, timer);
    }
  },

  setPresence(userId, status, lastSeenAt) {
    set((state) => ({
      presenceByUser: {
        ...state.presenceByUser,
        [userId]: { status, lastSeenAt },
      },
    }));
  },

  clear() {
    for (const timer of typingTimers.values()) clearTimeout(timer);
    typingTimers.clear();
    set({ typingByConversation: {}, presenceByUser: {} });
  },
}));
