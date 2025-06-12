import { db } from "@/db";
import { chats } from "@/db/schema";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createChatInputSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty."),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const input = createChatInputSchema.parse(body);

    const initialTitle = input.content.substring(0, 50);

    const [newChat] = await db
      .insert(chats)
      .values({
        id: crypto.randomUUID(),
        userId,
        title: initialTitle,
        shareId: crypto.randomUUID(),
      })
      .returning({ id: chats.id });

    if (!newChat?.id) {
      throw new Error("Failed to create a new chat.");
    }

    // const userMessageId = crypto.randomUUID();
    // await db.insert(messages).values({
    //   id: userMessageId,
    //   chatId: newChat.id,
    //   role: "user",
    //   contentType: "text",
    //   content: input.content,
    // });

    return NextResponse.json({ chatId: newChat.id });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return new NextResponse(errorMessage, { status: 500 });
  }
}
