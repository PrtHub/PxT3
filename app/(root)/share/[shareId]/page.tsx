import { db } from "@/db";
import { attachments, chats, messages } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import ChatView from "@/modules/chat/components/chat-view";
import { Attachment } from "@/modules/chat/types";

interface SharedChatPageProps {
  params: Promise<{ shareId: string }>;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  id: string;
  attachments?: Attachment[];
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

  const chatAttachments = await db
    .select()
    .from(attachments)
    .where(
      inArray(
        attachments.messageId,
        chatMessages.map((message) => message.id)
      )
    );

  const formattedMessages = chatMessages.map((message) => ({
    id: message.id,
    role: message.role as "user" | "assistant" | "system",
    content:
      message.contentType === "text"
        ? message.content
        : JSON.stringify(message.content),
    attachments:
      chatAttachments && chatAttachments.length > 0
        ? chatAttachments
            .filter((attachment) => attachment.messageId === message.id)
            .map((attachment) => ({
              id: attachment.id,
              url: attachment.url,
              name: attachment.filename,
            }))
        : [],
  }));

  return (
    <div className="flex flex-col w-full">
      <div className="absolute top-3 left-0 right-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
        <div className="max-w-3xl mx-auto w-full px-4 py-3 flex items-center justify-between">
          <div className="flex-1 min-w-0 flex items-center group">
            <h1 className="font-bold text-lg truncate mr-2">{chat.title}</h1>
          </div>
        </div>
      </div>
      <div className="p-4 h-[calc(100vh-10px)]">
        <ChatView
          key={chat.id}
          messages={formattedMessages as Message[]}
          streamingResponse=""
          loading={false}
          error={null}
        />
      </div>
    </div>
  );
};

export default SharedChatPage;
