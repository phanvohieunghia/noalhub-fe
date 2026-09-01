import { Typography } from "@noalhub/ui/typography";
export function ConversationListEmpty() {
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center">
      <Typography variant="title-4">Chưa có cuộc trò chuyện</Typography>
      <Typography variant="body-4" className="opacity-60">
        Các cuộc trò chuyện của bạn sẽ xuất hiện ở đây.
      </Typography>
    </div>
  );
}
