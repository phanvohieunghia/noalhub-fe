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
 * Gọi `useChatSocket()` ĐÚNG MỘT LẦN cho cả cây chat, và phát trạng thái kết
 * nối xuống qua context.
 *
 * Đặt ở layout của route group nên đổi hội thoại không unmount nó — socket
 * không bị dựng lại mỗi lần điều hướng. Gọi hook này ở hai chỗ là mỗi tin
 * append hai lần.
 */
export function ChatRealtimeProvider({ children }: { children: React.ReactNode }) {
  // Hook cần biết hội thoại đang mở để invalidate đúng key sau reconnect. Lấy
  // từ URL vì đó là nguồn sự thật duy nhất cho "đang mở cái nào".
  const params = useParams<{ conversationId?: string }>();
  const value = useChatSocket(params?.conversationId);

  return (
    <ChatRealtimeContext.Provider value={value}>
      {children}
    </ChatRealtimeContext.Provider>
  );
}
