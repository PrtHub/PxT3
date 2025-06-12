import ChatPage from "@/modules/chat/components/chat-page";

interface Props {
  params: Promise<{ chatId: string }>;
}

const Chat = async ({ params }: Props) => {
  const { chatId } = await params;

  return (
    <div className="w-full min-h-screen">
      <ChatPage chatId={chatId} />
    </div>
  );
};

export default Chat;
