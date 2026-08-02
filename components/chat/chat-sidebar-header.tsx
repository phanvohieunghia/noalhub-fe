"use client";

/**
 * Nút "Mới" CHƯA có ở giai đoạn 1: tạo DM cần `userId`, mà backend chưa có
 * endpoint tìm người dùng (`GET /api/users?search=` — xem `docs/chat.md` §0 #2).
 *
 * Cố ý không vẽ nút disabled: nút bấm không được là lời hứa suông. Khi endpoint
 * đó có thật thì mở lại `NewDirectConversationDialog` ở đây.
 */
export function ChatSidebarHeader() {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3">
      <h1 className="text-base font-semibold">Tin nhắn</h1>
    </div>
  );
}
