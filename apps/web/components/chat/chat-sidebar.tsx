"use client";

import { ChatSidebarHeader } from "./chat-sidebar-header";
import { ConversationList } from "./conversation-list";

export function ChatSidebar() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatSidebarHeader />
      <ConversationList />
    </div>
  );
}
