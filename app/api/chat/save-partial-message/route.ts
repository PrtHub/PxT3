import { db } from "@/db";
import { messages } from "@/db/schema";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const savePartialMessageInputSchema = z.object({
  chatId: z.string(),
  content: z.string().min(1),
  contentType: z.enum(["text", "image_url"]),
  parentId: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const input = savePartialMessageInputSchema.parse(body);

    const newMessageId = crypto.randomUUID();
    await db.insert(messages).values({
      id: newMessageId,
      chatId: input.chatId,
      role: "assistant",
      contentType: input.contentType,
      content: input.content,
      parentId: input.parentId || null,
    });

    return NextResponse.json({ success: true, messageId: newMessageId });
  } catch (error) {
    console.error("[SAVE_PARTIAL_MESSAGE_API]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error",
      { status: 500 }
    );
  }
} 