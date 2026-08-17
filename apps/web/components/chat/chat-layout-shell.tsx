"use client";

import { usePathname } from "next/navigation";

import { ChatSidebar } from "./chat-sidebar";
import { ConnectionBanner } from "./connection-banner";

/**
 * Khung 2 cột.
 *
 * Mobile là HAI MÀN HÌNH riêng, không phải hai cột co lại: `/chat` chỉ có
 * sidebar, `/chat/[id]` chỉ có pane. Chọn cột nào hiển thị bằng CSS
 * (`hidden md:flex`) chứ không bằng `useMediaQuery` — JS đo màn hình sẽ làm
 * layout nhảy một nhịp ở render đầu.
 *
 * `pathname` chỉ dùng để biết mobile đang ở màn hình nào; desktop luôn hiện cả
 * hai bất kể giá trị này.
 */
export function ChatLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasSelection = pathname !== "/chat";

  return (
    /* Chat CHIẾM ĐÚNG một màn hình và không bao giờ để trang cuộn: chỉ khi
       chiều cao bị chặn thì `flex-1 + overflow-y-auto` bên trong mới cuộn
       riêng được. `dvh` chứ không `vh` — thanh địa chỉ trên mobile. */
    <div className="flex h-dvh flex-col overflow-hidden">
      <ConnectionBanner />
      <div className="flex min-h-0 flex-1">
        <div
          className={`${hasSelection ? "hidden md:flex" : "flex"} w-full min-h-0 shrink-0 flex-col border-black/10 md:w-80 md:border-r dark:border-white/10`}
        >
          <ChatSidebar />
        </div>
        <div
          className={`${hasSelection ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-1 flex-col`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
