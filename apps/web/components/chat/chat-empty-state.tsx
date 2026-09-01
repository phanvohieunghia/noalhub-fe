import { Typography } from "@noalhub/ui/typography"; /** Màn hình bên phải khi ở `/chat` mà chưa chọn hội thoại nào. */
export function ChatEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <Typography variant="title-2" weight={500}>
        Chọn một cuộc trò chuyện
      </Typography>
      <Typography variant="body-3" className="max-w-sm opacity-60">
        Chọn hội thoại ở danh sách bên trái để bắt đầu đọc và trả lời tin nhắn.
      </Typography>
    </div>
  );
}
