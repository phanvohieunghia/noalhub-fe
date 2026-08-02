"use client";

import { Avatar } from "@/components/ui/avatar";
import { MessageBubble } from "./message-bubble";
import type { ConversationMember, Message } from "@/services/chat/types";

/**
 * Nhóm tin liên tiếp của cùng một người: avatar và tên chỉ hiện một lần.
 *
 * `Message` chỉ mang `senderId` — tên/avatar phải tra từ `members` của hội
 * thoại, nên map đó được truyền xuống từ `ChatPane` (đừng để mỗi bubble tự
 * `find()` trong mảng).
 */
export function MessageGroup({
  messages,
  senderId,
  members,
  currentUserId,
  onRetry,
}: {
  messages: Message[];
  senderId: string | null;
  members: Map<string, ConversationMember>;
  currentUserId: string | null;
  onRetry: (message: Message) => void;
}) {
  const mine = senderId !== null && senderId === currentUserId;
  const sender = senderId ? members.get(senderId) : undefined;

  // senderId null = người gửi đã bị xoá khỏi hệ thống (ON DELETE SET NULL).
  const name = senderId === null
    ? "Người dùng đã xoá"
    : (sender?.displayName ?? "Người dùng");

  const memberList = [...members.values()];

  return (
    <div className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
      {mine ? null : <Avatar name={name} src={sender?.avatarUrl} size="sm" />}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {mine ? null : (
          <span
            className={`px-1 text-xs opacity-60 ${
              senderId === null ? "italic" : ""
            }`}
          >
            {name}
          </span>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            mine={mine}
            members={memberList}
            currentUserId={currentUserId}
            onRetry={onRetry}
          />
        ))}
      </div>
    </div>
  );
}
