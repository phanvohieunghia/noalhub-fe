"use client";

import { createContext, useContext } from "react";
import { useParams } from "next/navigation";

import { useChatSocket } from "@noalhub/api/chat";
import type { ChatConnectionStatus } from "@noalhub/api/chat";

type ChatRealtimeValue = {
  status: ChatConnectionStatus;
  reconnect: () => void;
};

const ChatRealtimeContext = createContext<ChatRealtimeValue>({
  status: "connecting",
  reconnect: () => {},
});

export function useChatRealtime() {
  return useContext(ChatRealtimeContext);
}

/**
 * Calls `useChatSocket()` EXACTLY ONCE for the whole chat tree, and publishes
 * the connection state downward through context.
 *
 * It lives in the route group's layout, so switching conversations does not
 * unmount it — the socket is not rebuilt on every navigation. Calling this hook
 * in two places appends every message twice.
 */
export function ChatRealtimeProvider({ children }: { children: React.ReactNode }) {
  // The hook needs the open conversation to invalidate the right key after a
  // reconnect. Taken from the URL, the single source of truth for "which one is
  // open".
  const params = useParams<{ conversationId?: string }>();
  const value = useChatSocket(params?.conversationId);

  return (
    <ChatRealtimeContext.Provider value={value}>
      {children}
    </ChatRealtimeContext.Provider>
  );
}
