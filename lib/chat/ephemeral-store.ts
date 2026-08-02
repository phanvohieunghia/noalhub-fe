import { create } from "zustand";

import type { PresenceEntry, PresenceStatus } from "@/services/chat/types";

/**
 * Typing và presence KHÔNG vào React Query: chúng đổi vài lần mỗi giây và
 * không có "nguồn sự thật" để refetch. Nhét vào cache là ép invalidate liên
 * tục (`docs/chat.md` §5.7).
 */

/** Backend không persist `typing`; client tự tắt sau khoảng này. */
const TYPING_TTL_MS = 5_000;

type TypingKey = `${string}:${string}`;

/** Timeout theo từng (conversation, user) — nằm ngoài state để không re-render. */
const typingTimers = new Map<TypingKey, ReturnType<typeof setTimeout>>();

type EphemeralState = {
  /** conversationId → danh sách userId đang nhập. */
  typingByConversation: Record<string, string[]>;
  /** userId → presence. Vắng mặt = KHÔNG RÕ, không phải offline. */
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

    // TTL: thiếu nó thì "đang nhập…" treo vĩnh viễn khi event `typing:stop`
    // rơi mất — mà nó ĐƯỢC PHÉP rơi theo thiết kế của backend.
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
