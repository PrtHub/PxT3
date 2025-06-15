import { z } from "zod";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { auth } from "@/auth";
import { chats, messages } from "@/db/schema";

const branchChatSchema = z.object({
  chatId: z.string(),
  messageId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(
      "Unauthorized: You must be logged in to create a branch.",
      { status: 401 }
    );
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const input = branchChatSchema.parse(body);

    const [existingChat] = await db
      .select({ userId: chats.userId, title: chats.title })
      .from(chats)
      .where(eq(chats.id, input.chatId))
      .limit(1);

    if (!existingChat) {
      throw new Error("Chat not found.");
    }
    if (existingChat.userId !== userId) {
      throw new Error("You are not authorized to access this chat.");
    }

    const [branchMessage] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, input.messageId))
      .limit(1);

    if (!branchMessage) {
      throw new Error("Message not found.");
    }

    const newChatId = crypto.randomUUID();
    const newShareId = crypto.randomUUID();
    const branchName = `Branch from: ${existingChat.title.substring(0, 50)}${existingChat.title.length > 50 ? '...' : ''}`;

    await db.insert(chats).values({
      id: newChatId,
      userId,
      title: branchName,
      shareId: newShareId,
      parentChatId: input.chatId,
      branchedFromMessageId: input.messageId,
      branchName,
    });

    const messagesToCopy = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, input.chatId))
      .orderBy(messages.createdAt);

    const branchPointIndex = messagesToCopy.findIndex(msg => msg.id === input.messageId);
    if (branchPointIndex === -1) {
      throw new Error("Could not find branching point in messages.");
    }

    const messagesToInsert = messagesToCopy
      .slice(0, branchPointIndex + 1)
      .map(msg => ({
        id: crypto.randomUUID(),
        chatId: newChatId,
        role: msg.role,
        contentType: msg.contentType,
        content: msg.content,
        parentId: msg.parentId,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      }));

    if (messagesToInsert.length > 0) {
      await db.insert(messages).values(messagesToInsert);
    }

    return NextResponse.json({
      success: true,
      newChatId,
      branchName,
    });
  } catch (error) {
    console.error("[CHAT_BRANCH_API]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return new NextResponse(errorMessage, { status: 500 });
  }
} 