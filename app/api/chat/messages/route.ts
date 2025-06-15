import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { auth } from "@/auth";
import { eq, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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

  const formattedMessages = chatMessages.map((message) => {
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
      createdAt: message.createdAt,
      parentId: message.parentId,
    };
  });

  return NextResponse.json({ messages: formattedMessages });
} 