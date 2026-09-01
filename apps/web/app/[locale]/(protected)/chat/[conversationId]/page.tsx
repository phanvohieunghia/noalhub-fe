import { ChatPane } from "@/components/chat/chat-pane";

/**
 * `params` là async ở Next 16 (bản đồng bộ đã bị xoá hẳn). Await ở server rồi
 * truyền prop xuống client component — rõ ràng hơn `useParams()` về biên
 * server/client.
 */
export default async function ConversationPage(
  props: PageProps<"/[locale]/chat/[conversationId]">,
) {
  const { conversationId } = await props.params;
  return <ChatPane conversationId={conversationId} />;
}
