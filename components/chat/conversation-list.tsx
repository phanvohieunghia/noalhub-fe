"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { Spinner } from "@/components/ui/spinner";
import { ConversationListEmpty } from "./conversation-list-empty";
import { ConversationListItem } from "./conversation-list-item";
import { ConversationListSkeleton } from "./conversation-list-skeleton";
import { ConversationSearch } from "./conversation-search";
import { useConversations } from "@/services/chat/hooks";
import { conversationDisplayName } from "@/lib/chat/format";
import { useAuthStore } from "@/lib/auth/store";
import { errorMessage } from "@/lib/chat/error-message";

export function ConversationList() {
  const params = useParams<{ conversationId?: string }>();
  const activeId = params?.conversationId;
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const [query, setQuery] = useState("");

  const {
    data,
    isPending,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useConversations();

  // Thứ tự giữ NGUYÊN như backend trả về (nó sort theo last_message_at, cột
  // không lộ ra DTO nên client không sort lại được cho đúng). Cache được patch
  // theo cách đẩy hội thoại vừa có tin lên đầu — xem hooks.ts.
  const conversations = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) =>
      conversationDisplayName(conversation, currentUserId)
        .toLowerCase()
        .includes(needle),
    );
  }, [conversations, query, currentUserId]);

  const sentinelRef = useInfiniteScroll(
    () => void fetchNextPage(),
    Boolean(hasNextPage) && !isFetchingNextPage,
  );

  if (isPending) return <ConversationListSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2 p-4">
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errorMessage(error)}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-md border border-black/15 px-2 py-1 text-xs dark:border-white/20"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (conversations.length === 0) return <ConversationListEmpty />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ConversationSearch value={query} onChange={setQuery} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-xs opacity-60">
            Không có hội thoại nào khớp “{query}”.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5 px-2 pb-2">
            {filtered.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeId}
              />
            ))}
          </ul>
        )}

        {/* Lọc client-side ẩn mất sentinel → chỉ tải thêm khi không lọc. */}
        {query.trim() ? null : (
          <div ref={sentinelRef} className="flex justify-center py-2">
            {isFetchingNextPage ? <Spinner /> : null}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Tải thêm khi sentinel lọt vào khung nhìn. `IntersectionObserver` chứ không
 * `onScroll` — scroll handler chạy mỗi frame.
 */
function useInfiniteScroll(onReach: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  // Ghi ref trong effect, KHÔNG trong lúc render.
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
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return ref;
}
