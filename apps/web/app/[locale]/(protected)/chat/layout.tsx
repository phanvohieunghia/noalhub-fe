import { IntlProvider } from "@noalhub/i18n/provider";
import { setRequestLocale } from "next-intl/server";

import { ChatLayoutShell } from "@/components/chat/chat-layout-shell";
import { ChatRealtimeProvider } from "@/components/chat/chat-realtime-provider";

/**
 * Layout của route group: sidebar và socket sống ở đây nên đổi hội thoại KHÔNG
 * unmount chúng — không dựng lại kết nối mỗi lần điều hướng.
 *
 * `AuthGuard` đã bọc ở `app/[locale]/(protected)/layout.tsx`, không cần thêm.
 */
export default async function ChatLayout({ children, params }: LayoutProps<"/[locale]/chat">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <IntlProvider namespace="web.chat">
      <ChatRealtimeProvider>
        <ChatLayoutShell>{children}</ChatLayoutShell>
      </ChatRealtimeProvider>
    </IntlProvider>
  );
}
