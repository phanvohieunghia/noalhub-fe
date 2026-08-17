"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Spinner } from "@noalhub/ui/spinner";
import { DateSeparator } from "./date-separator";
import { MessageGroup } from "./message-group";
import { MessageListSkeleton } from "./message-list-skeleton";
import { MessageSystemNotice } from "./message-system-notice";
import { ScrollToBottomButton } from "./scroll-to-bottom-button";
import { errorMessage } from "@noalhub/core/chat/error-message";
import { GROUP_WINDOW_MS, isSameDay } from "@noalhub/core/chat/format";
import type { ConversationMember, Message } from "@noalhub/api/chat";

/** "Đang ở đáy" — 0 tuyệt đối không dùng được vì sub-pixel rounding. */
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [anchorLength, setAnchorLength] = useState<number | null>(null);

  // API trả mới→cũ. Đảo một lần ở đây để phần render bên dưới đọc xuôi theo
  // thời gian như mắt người.
  const ordered = useMemo(() => [...messages].reverse(), [messages]);
  const items = useMemo(() => groupMessages(ordered), [ordered]);

  const latestId = ordered.at(-1)?.id;
  const messageCount = ordered.length;

  /**
   * Số tin mới xuất hiện từ lúc người dùng rời khỏi đáy — SUY RA, không phải
   * đếm bằng effect.
   *
   * `anchorLength` là độ dài danh sách tại thời điểm rời đáy, và nó chỉ được
   * đặt trong handler scroll (một event handler). Đếm bằng `setState` trong
   * effect là thứ ESLint v16 chặn thẳng (`react-hooks/set-state-in-effect`), và
   * chặn đúng: đó là state suy ra được.
   */
  const newCount =
    anchorLength === null ? 0 : Math.max(0, ordered.length - anchorLength);

  /* --- Giữ vị trí đọc khi prepend trang cũ --------------------------------
     Thêm nội dung vào ĐẦU làm scrollHeight tăng; nếu không bù lại thì màn hình
     nhảy. Đo trước khi DOM cập nhật, bù ngay sau đó.                        */
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

  /* --- Cuộn xuống đáy ---------------------------------------------------- */
  const scrollToBottom = useCallback((smooth: boolean) => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({
      top: node.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  // Lần đầu có dữ liệu: nhảy thẳng xuống đáy, KHÔNG animate.
  const didInitialScrollRef = useRef(false);
  useEffect(() => {
    if (didInitialScrollRef.current || ordered.length === 0) return;
    didInitialScrollRef.current = true;
    scrollToBottom(false);
  }, [ordered.length, scrollToBottom]);

  /**
   * Tin mới về: đang ở đáy (hoặc tin của chính mình) thì theo nó; đã cuộn lên
   * đọc lịch sử thì KHÔNG giật màn hình của người ta.
   *
   * Effect này chỉ chạm DOM (cuộn) — không `setState`. Chính hành động cuộn sẽ
   * phát event scroll, và handler dưới đây mới là chỗ cập nhật state.
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

  // Tới đáy = đã đọc. Điều kiện "tab visible" và debounce nằm ở ChatPane.
  useEffect(() => {
    if (atBottom && latestId) onReachBottom(latestId);
  }, [atBottom, latestId, onReachBottom]);

  const handleScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;

    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    const nowAtBottom = distance < BOTTOM_THRESHOLD_PX;

    setAtBottom(nowAtBottom);
    // Chốt mốc đếm ĐÚNG lúc rời đáy; về đáy thì xoá mốc. Cả hai nhánh nằm
    // trong event handler nên setState ở đây là hợp lệ.
    setAnchorLength((current) => {
      if (nowAtBottom) return null;
      return current ?? messageCount;
    });
    // Phụ thuộc thẳng vào số tin, không đi qua ref: đây là prop `onScroll` của
    // một element React, đổi hàm chỉ là gán lại prop — không có
    // addEventListener nào bị tháo ra gắn lại.
  }, [messageCount]);

  const sentinelRef = useTopSentinel(handleLoadOlder, hasOlder && !isFetchingOlder);

  if (isPending) return <MessageListSkeleton />;

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errorMessage(error)}
        </p>
      </div>
    );
  }

  if (ordered.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm opacity-60">Chưa có tin nhắn nào. Nói gì đó đi.</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        // `role="log"` + `aria-live="polite"`: screen reader đọc tin mới mà
        // không cắt lời người dùng đang gõ.
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Tin nhắn"
        className="flex-1 overflow-y-auto px-4 py-3"
      >
        <div ref={sentinelRef} className="flex justify-center py-1">
          {isFetchingOlder ? <Spinner /> : null}
          {!hasOlder && ordered.length > 0 ? (
            <span className="text-[11px] opacity-40">Đầu cuộc trò chuyện</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          {items.map((item) => {
            if (item.kind === "separator") {
              return <DateSeparator key={item.key} iso={item.iso} />;
            }
            if (item.kind === "system") {
              return (
                <MessageSystemNotice key={item.key} body={item.message.body} />
              );
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
        <ScrollToBottomButton
          newCount={newCount}
          onClick={() => scrollToBottom(true)}
        />
      )}
    </div>
  );
}

/**
 * Gộp tin thành nhóm + chèn `DateSeparator`.
 *
 * Nhận mảng đã sắp XUÔI theo thời gian. Tin `system` luôn đứng riêng — nó không
 * thuộc về ai nên không gộp vào nhóm nào.
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
      new Date(message.createdAt).getTime() -
        new Date(previous.createdAt).getTime() <
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
 * Tải trang cũ khi sentinel ở ĐỈNH lọt vào khung nhìn. `IntersectionObserver`
 * chứ không `onScroll` — scroll handler chạy mỗi frame.
 */
function useTopSentinel(onReach: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  // Ghi ref trong effect, KHÔNG trong lúc render: mục đích là giữ callback mới
  // nhất mà không phải gắn lại observer mỗi lần parent render.
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
