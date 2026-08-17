import type { ConversationMember } from "@noalhub/api/chat";

/**
 * `✓` đã gửi · `✓✓` đã có người đọc.
 *
 * Backend không trả cờ "đã đọc" cho từng tin — nó trả `lastReadMessageId` của
 * từng thành viên. So sánh được vì id là UUID v7 (sắp theo thời gian): tin này
 * đã đọc nếu con trỏ của người khác >= id của nó.
 */
export function ReadReceipt({
  messageId,
  members,
  currentUserId,
}: {
  messageId: string;
  members: ConversationMember[];
  currentUserId: string | null;
}) {
  const readByOther = members.some(
    (member) =>
      member.userId !== currentUserId &&
      member.lastReadMessageId !== null &&
      member.lastReadMessageId.localeCompare(messageId) >= 0,
  );

  return (
    <span className="text-[11px] leading-none opacity-70">
      <span aria-hidden>{readByOther ? "✓✓" : "✓"}</span>
      <span className="sr-only">{readByOther ? "Đã đọc" : "Đã gửi"}</span>
    </span>
  );
}
