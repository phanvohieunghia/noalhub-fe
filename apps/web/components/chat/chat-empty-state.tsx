/** Màn hình bên phải khi ở `/chat` mà chưa chọn hội thoại nào. */
export function ChatEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-lg font-medium">Chọn một cuộc trò chuyện</p>
      <p className="max-w-sm text-sm opacity-60">
        Chọn hội thoại ở danh sách bên trái để bắt đầu đọc và trả lời tin nhắn.
      </p>
    </div>
  );
}
