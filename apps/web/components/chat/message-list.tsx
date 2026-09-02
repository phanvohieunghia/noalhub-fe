"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Spinner } from "@noalhub/ui/spinner";
import { DateSeparator } from "./date-separator";
import { MessageGroup } from "./message-group";
import { MessageListSkeleton } from "./message-list-skeleton";
import { MessageSystemNotice } from "./message-system-notice";
import { ScrollToBottomButton } from "./scroll-to-bottom-button";
import { errorText } from "@noalhub/core/chat/error-message";
import { GROUP_WINDOW_MS, isSameDay } from "@noalhub/core/chat/format";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import type { ConversationMember, Message } from "@noalhub/api/chat";
import { Typography } from "@noalhub/ui/typography";

/** "At the bottom" — an exact 0 is unusable because of sub-pixel rounding. */
const BOTTOM_THRESHOLD_PX = 80;

type Item =
  | { kind: "separator"; key: string; iso: string }
  | { kind: "system"; key: string; message: Message }
  | { kind: "group"; key: string; senderId: string | null; messages: Message[] };

export function MessageList({
  messages,
  members,
  currentUserId,
  isPending,
  error,
  hasOlder,
  isFetchingOlder,
  onLoadOlder,
  onRetry,
  onReachBottom,
}: {
  messages: Message[];
  members: Map<string, ConversationMember>;
  currentUserId: string | null;
  isPending: boolean;
  error: unknown;
  hasOlder: boolean;
  isFetchingOlder: boolean;
  onLoadOlder: () => void;
  onRetry: (message: Message) => void;
  onReachBottom: (latestMessageId: string) => void;
}) {
  const t = useTranslations("web.chat.messages");
  const tc = useTranslations("web.chat.conversation");
  const m = useMessage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [anchorLength, setAnchorLength] = useState<number | null>(null);

  // The API returns newest→oldest. Reversed once here so the rendering below
  // reads forward in time, the way a person does.
  const ordered = useMemo(() => [...messages].reverse(), [messages]);
  const items = useMemo(() => groupMessages(ordered), [ordered]);

  const latestId = ordered.at(-1)?.id;
  const messageCount = ordered.length;

  /**
   * How many new messages arrived since the user left the bottom — DERIVED, not
   * counted in an effect.
   *
   * `anchorLength` is the list length at the moment of leaving the bottom, and
   * it is only set inside the scroll handler (an event handler). Counting with
   * `setState` in an effect is something ESLint v16 blocks outright
   * (`react-hooks/set-state-in-effect`), and rightly: this is derivable state.
   */
  const newCount = anchorLength === null ? 0 : Math.max(0, ordered.length - anchorLength);

  /* --- Preserving the reading position when prepending an older page ------
     Adding content at the TOP increases scrollHeight; without compensation the
     view jumps. Measure before the DOM updates, compensate right after.     */
  const prependAnchorRef = useRef<{ height: number; top: number } | null>(null);

  const handleLoadOlder = useCallback(() => {
    const node = scrollRef.current;
    if (node) {
      prependAnchorRef.current = {
        height: node.scrollHeight,
        top: node.scrollTop,
      };
    }
    onLoadOlder();
  }, [onLoadOlder]);

  useEffect(() => {
    const node = scrollRef.current;
    const anchor = prependAnchorRef.current;
    if (!node || !anchor) return;

    prependAnchorRef.current = null;
    node.scrollTop = anchor.top + (node.scrollHeight - anchor.height);
  }, [ordered.length]);

  /* --- Scrolling to the bottom ------------------------------------------- */
  const scrollToBottom = useCallback((smooth: boolean) => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({
      top: node.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  // The first time data arrives: jump straight to the bottom, with NO animation.
  const didInitialScrollRef = useRef(false);
  useEffect(() => {
    if (didInitialScrollRef.current || ordered.length === 0) return;
    didInitialScrollRef.current = true;
    scrollToBottom(false);
  }, [ordered.length, scrollToBottom]);

  /**
   * A new message arrives: if we are at the bottom (or it is our own message),
   * follow it; if the user has scrolled up to read history, do NOT yank their
   * view.
   *
   * This effect only touches the DOM (scrolling) — no `setState`. The scroll
   * itself fires a scroll event, and the handler below is where state updates.
   */
  const prevLatestIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const previous = prevLatestIdRef.current;
    prevLatestIdRef.current = latestId;

    if (!latestId || latestId === previous) return;
    if (!didInitialScrollRef.current) return;

    const isMine = ordered.at(-1)?.senderId === currentUserId;
    if (atBottom || isMine) scrollToBottom(true);
  }, [latestId, atBottom, ordered, currentUserId, scrollToBottom]);

  // Reaching the bottom means read. The "tab visible" condition and the debounce live in ChatPane.
  useEffect(() => {
    if (atBottom && latestId) onReachBottom(latestId);
  }, [atBottom, latestId, onReachBottom]);

  const handleScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;

    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    const nowAtBottom = distance < BOTTOM_THRESHOLD_PX;

    setAtBottom(nowAtBottom);
    // The counting anchor is fixed at the exact moment of leaving the bottom, and
    // cleared on returning. Both branches are inside an event handler, so
    // setState here is legitimate.
    setAnchorLength((current) => {
      if (nowAtBottom) return null;
      return current ?? messageCount;
    });
    // Depending directly on the message count rather than going through a ref:
    // this is a React element's `onScroll` prop, so a new function is just a
    // reassigned prop — no addEventListener is torn down and re-attached.
  }, [messageCount]);

  const sentinelRef = useTopSentinel(handleLoadOlder, hasOlder && !isFetchingOlder);

  if (isPending) return <MessageListSkeleton />;

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Typography variant="body-3" role="alert" className="text-red-600 dark:text-red-400">
          {m(errorText(error))}
        </Typography>
      </div>
    );
  }

  if (ordered.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Typography variant="body-3" className="opacity-60">
          {tc("noMessagesYet")}
        </Typography>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        // `role="log"` + `aria-live="polite"`: a screen reader announces new
        // messages without interrupting the user mid-typing.
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={t("label")}
        className="flex-1 overflow-y-auto px-4 py-3"
      >
        <div ref={sentinelRef} className="flex justify-center py-1">
          {isFetchingOlder ? <Spinner /> : null}
          {!hasOlder && ordered.length > 0 ? (
            <span className="text-[11px] opacity-40">{t("conversationStart")}</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          {items.map((item) => {
            if (item.kind === "separator") {
              return <DateSeparator key={item.key} iso={item.iso} />;
            }
            if (item.kind === "system") {
              return <MessageSystemNotice key={item.key} body={item.message.body} />;
            }
            return (
              <MessageGroup
                key={item.key}
                messages={item.messages}
                senderId={item.senderId}
                members={members}
                currentUserId={currentUserId}
                onRetry={onRetry}
              />
            );
          })}
        </div>
      </div>

      {atBottom ? null : (
        <ScrollToBottomButton newCount={newCount} onClick={() => scrollToBottom(true)} />
      )}
    </div>
  );
}

/**
 * Groups messages and inserts `DateSeparator`s.
 *
 * Takes an array already sorted FORWARD in time. A `system` message always
 * stands alone — it belongs to nobody, so it joins no group.
 */
function groupMessages(ordered: Message[]): Item[] {
  const items: Item[] = [];
  let current: { senderId: string | null; messages: Message[] } | null = null;

  const flush = () => {
    if (!current) return;
    const first = current.messages[0]!;
    items.push({
      kind: "group",
      key: `g-${first.id}`,
      senderId: current.senderId,
      messages: current.messages,
    });
    current = null;
  };

  ordered.forEach((message, index) => {
    const previous = ordered[index - 1];

    if (!previous || !isSameDay(previous.createdAt, message.createdAt)) {
      flush();
      items.push({
        kind: "separator",
        key: `d-${message.id}`,
        iso: message.createdAt,
      });
    }

    if (message.type === "system") {
      flush();
      items.push({ kind: "system", key: `s-${message.id}`, message });
      return;
    }

    const sameSender = current?.senderId === message.senderId;
    const withinWindow =
      previous !== undefined &&
      new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() <
        GROUP_WINDOW_MS;

    if (current && sameSender && withinWindow) {
      current.messages.push(message);
    } else {
      flush();
      current = { senderId: message.senderId, messages: [message] };
    }
  });

  flush();
  return items;
}

/**
 * Loads an older page when the sentinel at the TOP enters the viewport.
 * `IntersectionObserver` rather than `onScroll` — a scroll handler runs every
 * frame.
 */
function useTopSentinel(onReach: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  // The ref is written in an effect, NEVER during render: the point is to keep
  // the latest callback without re-attaching the observer on every parent
  // render.
  const onReachRef = useRef(onReach);
  useEffect(() => {
    onReachRef.current = onReach;
  }, [onReach]);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onReachRef.current();
      },
      { rootMargin: "150px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return ref;
}
