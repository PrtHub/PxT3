import { db } from "@/db";
import { chats, messages, attachments } from "@/db/schema";
import { auth } from "@/auth";
import { eq, and, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type MessageContent = string | Record<string, unknown>;

interface MessageWithAttachments {
  id: string;
  role: string;
  content: MessageContent;
  contentType: string;
  createdAt: Date;
  parentId: string | null;
  attachments: Array<{
    id: string;
    url: string;
    name: string;
  }>;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");
  if (!chatId) {
    return new NextResponse("Missing chatId", { status: 400 });
  }

  const [chat] = await db
    .select({ id: chats.id, userId: chats.userId })
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);
  if (!chat) {
    return new NextResponse("Chat not found", { status: 404 });
  }
  if (chat.userId !== userId) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const chatMessages = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      contentType: messages.contentType,
      createdAt: messages.createdAt,
      parentId: messages.parentId,
    })
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt));

  const messageIds = chatMessages.map(m => m.id);
  const messageAttachments = messageIds.length > 0 ? await db
    .select({
      id: attachments.id,
      messageId: attachments.messageId,
      url: attachments.url,
      name: attachments.filename,
    })
    .from(attachments)
    .where(and(
      eq(attachments.status, 'completed'),
      messageIds.length > 0 ? 
        eq(attachments.messageId, messageIds[0]) : 
        eq(attachments.messageId, '')
    ))
    .orderBy(asc(attachments.createdAt)) : [];

  const attachmentsByMessageId = messageAttachments.reduce<Record<string, typeof messageAttachments>>((acc, attachment) => {
    if (!acc[attachment.messageId]) {
      acc[attachment.messageId] = [];
    }
    acc[attachment.messageId].push(attachment);
    return acc;
  }, {});

  const formattedMessages: MessageWithAttachments[] = chatMessages.map((message) => {
    let parsedContent;
    if (message.contentType === "text" || message.contentType === "image") {
      parsedContent = message.content;
    } else {
      try {
        parsedContent = JSON.parse(message.content);
      } catch {
        parsedContent = "[Error displaying content]";
      }
    }
    
    return {
      id: message.id,
      role: message.role,
      content: parsedContent,
      contentType: message.contentType,
      createdAt: message.createdAt,
      parentId: message.parentId,
      attachments: attachmentsByMessageId[message.id]?.map(att => ({
        id: att.id,
        url: att.url,
        name: att.name,
      })) || [],
    };
  });

  return NextResponse.json({ messages: formattedMessages });
}