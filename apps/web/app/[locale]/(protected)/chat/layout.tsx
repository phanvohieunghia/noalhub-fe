import { IntlProvider } from "@noalhub/i18n/provider";
import { setRequestLocale } from "next-intl/server";

import { ChatLayoutShell } from "@/components/chat/chat-layout-shell";
import { ChatRealtimeProvider } from "@/components/chat/chat-realtime-provider";

/**
 * The route group's layout: the sidebar and the socket live here, so switching
 * conversations does NOT unmount them — the connection is not rebuilt on every
 * navigation.
 *
 * `AuthGuard` already wraps at `app/[locale]/(protected)/layout.tsx`; no second
 * one is needed.
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
