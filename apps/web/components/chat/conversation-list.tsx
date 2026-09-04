"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { Button } from "@noalhub/ui/button";
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

  // The order is kept EXACTLY as the backend returned it (it sorts by
  // last_message_at, a column not exposed in the DTO, so the client cannot
  // re-sort correctly). The cache is patched by moving a conversation that just
  // received a message to the front — see hooks.ts.
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
        <Button variant="outline" size="xs" onClick={() => void refetch()}>
          {tc("actions.retry")}
        </Button>
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

        {/* Client-side filtering hides the sentinel → only load more when unfiltered. */}
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
 * Loads more when the sentinel enters the viewport. `IntersectionObserver`
 * rather than `onScroll` — a scroll handler runs every frame.
 */
function useInfiniteScroll(onReach: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  // The ref is written in an effect, NEVER during render.
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
