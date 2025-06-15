import { z } from "zod";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { auth } from "@/auth";
import { chats, messages } from "@/db/schema";

const savePartialMessageSchema = z.object({
  chatId: z.string(),
  content: z.string(),
  parentMessageId: z.string().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(
      "Unauthorized: You must be logged in to save a message.",
      { status: 401 }
    );
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const input = savePartialMessageSchema.parse(body);

    const [existingChat] = await db
      .select({ userId: chats.userId })
      .from(chats)
      .where(eq(chats.id, input.chatId))
      .limit(1);

    if (!existingChat) {
      throw new Error("Chat not found.");
    }
    if (existingChat.userId !== userId) {
      throw new Error("You are not authorized to access this chat.");
    }

    const aiMessageId = crypto.randomUUID();
    await db.insert(messages).values({
      id: aiMessageId,
      chatId: input.chatId,
      role: "assistant",
      contentType: "text",
      content: input.content,
      parentId: input.parentMessageId,
    });

    return NextResponse.json({ success: true, messageId: aiMessageId });
  } catch (error) {
    console.error("[SAVE_PARTIAL_MESSAGE_API]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return new NextResponse(errorMessage, { status: 500 });
  }
} 