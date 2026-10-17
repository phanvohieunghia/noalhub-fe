"use client";

import { usePathname } from "@noalhub/i18n/navigation";

import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteHeader } from "@/components/layout/site-header";

import { ChatSidebar } from "./chat-sidebar";
import { ConnectionBanner } from "./connection-banner";

/**
 * The two-column shell.
 *
 * On mobile these are TWO SEPARATE SCREENS, not two shrunken columns: `/chat`
 * shows only the sidebar, `/chat/[id]` only the pane. Which column shows is
 * decided in CSS (`hidden md:flex`) rather than with `useMediaQuery` — measuring
 * the screen in JS makes the layout jump for one beat on the first render.
 *
 * Like the practice area, it sits under the app header (`SiteHeader`) on `md` and up; phones use the bottom nav instead.
 *
 * `pathname` only tells mobile which screen it is on; desktop always shows both
 * regardless of its value.
 */
export function ChatLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasSelection = pathname !== "/chat";

  return (
    /* Chat occupies EXACTLY one screen and never lets the page scroll: only with
       a bounded height can the inner `flex-1 + overflow-y-auto` scroll on its
       own. `dvh` rather than `vh` — the mobile address bar. */
    <div className="flex h-dvh flex-col overflow-hidden">
      <SiteHeader />
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
      {/* Only on the conversation list: an open conversation takes the whole screen. */}
      {!hasSelection && <MobileNav />}
    </div>
  );
}
