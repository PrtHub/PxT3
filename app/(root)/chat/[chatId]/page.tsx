import ChatPage from "@/modules/chat/components/chat-page";
import { HydrateClient, trpc } from "@/trpc/server";

interface Props {
  params: Promise<{ chatId: string }>;
}

const Chat = async ({ params }: Props) => {
  const { chatId } = await params;

  void trpc.chat.getOneChat.prefetch({ chatId });

  return (
    <HydrateClient>
      <div className="w-full min-h-screen">
        <ChatPage chatId={chatId} />
      </div>
    </HydrateClient>
  );
};

export default Chat;
