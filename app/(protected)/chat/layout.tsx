import { ChatLayoutShell } from "@/components/chat/chat-layout-shell";
import { ChatRealtimeProvider } from "@/components/chat/chat-realtime-provider";

/**
 * Layout của route group: sidebar và socket sống ở đây nên đổi hội thoại KHÔNG
 * unmount chúng — không dựng lại kết nối mỗi lần điều hướng.
 *
 * `AuthGuard` đã bọc ở `app/(protected)/layout.tsx`, không cần thêm.
 */
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatRealtimeProvider>
      <ChatLayoutShell>{children}</ChatLayoutShell>
    </ChatRealtimeProvider>
  );
}
