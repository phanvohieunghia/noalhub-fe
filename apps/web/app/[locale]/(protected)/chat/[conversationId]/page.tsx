import { ChatPane } from "@/components/chat/chat-pane";

/**
 * `params` is async in Next 16 (the synchronous form is gone entirely). Await it
 * on the server and pass it as a prop to the client component — clearer about
 * the server/client boundary than `useParams()`.
 */
export default async function ConversationPage(
  props: PageProps<"/[locale]/chat/[conversationId]">,
) {
  const { conversationId } = await props.params;
  return <ChatPane conversationId={conversationId} />;
}
