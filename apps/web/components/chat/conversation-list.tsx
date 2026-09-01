"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { Spinner } from "@noalhub/ui/spinner";
import { ConversationListEmpty } from "./conversation-list-empty";
import { ConversationListItem } from "./conversation-list-item";
import { ConversationListSkeleton } from "./conversation-list-skeleton";
import { ConversationSearch } from "./conversation-search";
import { useConversations } from "@noalhub/api/chat";
import { useAuthStore } from "@noalhub/api/auth";
import { errorText } from "@noalhub/core/chat/error-message";
import { useMessage } from "@noalhub/i18n/use-message";
import { useTranslations } from "next-intl";
import { Typography } from "@noalhub/ui/typography";

import { useChatFormat } from "./use-chat-format";

export function ConversationList() {
  const t = useTranslations("web.chat.sidebar");
  const tc = useTranslations("common");
  const m = useMessage();
  const cf = useChatFormat();
  const params = useParams<{ conversationId?: string }>();
  const activeId = params?.conversationId;
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const [query, setQuery] = useState("");

  const { data, isPending, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useConversations();

  // Thứ tự giữ NGUYÊN như backend trả về (nó sort theo last_message_at, cột
  // không lộ ra DTO nên client không sort lại được cho đúng). Cache được patch
  // theo cách đẩy hội thoại vừa có tin lên đầu — xem hooks.ts.
  const conversations = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) =>
      cf.conversationName(conversation, currentUserId).toLowerCase().includes(needle),
    );
  }, [conversations, query, currentUserId, cf]);

  const sentinelRef = useInfiniteScroll(
    () => void fetchNextPage(),
    Boolean(hasNextPage) && !isFetchingNextPage,
  );

  if (isPending) return <ConversationListSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2 p-4">
        <Typography variant="body-3" role="alert" className="text-red-600 dark:text-red-400">
          {m(errorText(error))}
        </Typography>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-md border border-black/15 px-2 py-1 text-body-4 dark:border-white/20"
        >
          {tc("actions.retry")}
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
          <Typography variant="body-4" className="p-4 text-center opacity-60">
            {t("noMatch", { query })}
          </Typography>
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
