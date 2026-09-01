"use client";

import type { ConversationMember } from "@noalhub/api/chat";

/**
 * "An đang nhập…". Tự tắt sau 5s nhờ TTL trong ephemeral store — event
 * `typing:stop` được phép rơi theo thiết kế backend, nên không thể chỉ dựa vào
 * nó.
 */
export function TypingIndicator({
  userIds,
  members,
}: {
  userIds: string[];
  members: Map<string, ConversationMember>;
}) {
  // Giữ chiều cao cố định để bubble cuối không nhảy lên xuống mỗi lần ai đó gõ.
  if (userIds.length === 0) return <div className="h-5" />;

  const names = userIds.map((id) => members.get(id)?.displayName ?? "Người dùng");

  const label =
    names.length === 1
      ? `${names[0]} đang nhập…`
      : names.length === 2
        ? `${names[0]} và ${names[1]} đang nhập…`
        : `${names[0]} và ${names.length - 1} người khác đang nhập…`;

  return (
    <div className="text-body-4 h-5 shrink-0 px-4 opacity-60" aria-live="polite">
      {label}
    </div>
  );
}
