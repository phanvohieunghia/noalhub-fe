export function ConversationListEmpty() {
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center">
      <p className="text-sm font-medium">Chưa có cuộc trò chuyện</p>
      <p className="text-xs opacity-60">
        Các cuộc trò chuyện của bạn sẽ xuất hiện ở đây.
      </p>
    </div>
  );
}
