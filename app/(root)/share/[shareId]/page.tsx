import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ChatView from "@/modules/chat/components/chat-view";

interface SharedChatPageProps {
  params: Promise<{ shareId: string }>;
}

const SharedChatPage = async ({ params }: SharedChatPageProps) => {
  const { shareId } = await params;

  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.shareId, shareId))
    .limit(1);

  if (!chat || !chat.isPublic) {
    notFound();
  }

  const chatMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chat.id))
    .orderBy(messages.createdAt);

  const formattedMessages = chatMessages.map((message) => ({
    role: message.role as "user" | "assistant" | "system",
    content:
      message.contentType === "text"
        ? message.content
        : JSON.stringify(message.content),
  }));

  return (
    <div className="flex flex-col w-full">
       <div className="absolute top-3 left-0 right-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="max-w-3xl mx-auto w-full px-4 py-3 flex items-center justify-between">
          <div className="flex-1 min-w-0 flex items-center group">
            <h1 className="font-bold text-lg truncate mr-2">
              {chat.title}
            </h1>
          </div>
        </div>
      </div>
      <div className="p-4 h-[calc(100vh-10px)]">
        <ChatView
          messages={formattedMessages}
          streamingResponse=""
          loading={false}
        />
      </div>
    </div>
  );
};

export default SharedChatPage;
