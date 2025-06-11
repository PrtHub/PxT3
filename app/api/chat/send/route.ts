import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { openrouter } from "@/lib/open-router";
import { auth } from "@/auth"; 
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const chatContentPartTextSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const chatContentPartImageUrlSchema = z.object({
  type: z.literal("image_url"),
  image_url: z.object({
    url: z.string().url(),
    detail: z.enum(["low", "high", "auto"]).optional(),
  }),
});

const chatContentPartSchema = z.union([
  chatContentPartTextSchema,
  chatContentPartImageUrlSchema,
]);

const messageContentInputSchema = z.union([
  z.string().min(1, "Message content cannot be empty."),
  z
    .array(chatContentPartSchema)
    .min(1, "Message content array cannot be empty."),
]);

const sendMessageInputSchema = z.object({
  chatId: z.string().optional(),
  content: messageContentInputSchema,
  model: z.string().default("google/gemini-2.0-flash-exp:free"),
  parentMessageId: z.string().optional().nullable(),
});


export async function POST(req: NextRequest) {
    console.log("\n--- [API /api/chat/send] Received new request ---");
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized: You must be logged in to send a message.", { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const input = sendMessageInputSchema.parse(body);
    console.log(`[API] Parsed input for chatId: ${input.chatId || 'new chat'}`);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const enqueue = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };
        
        let currentChatId = input.chatId;
        let isNewChat = false;

        console.log(`[API] Using chatId: ${currentChatId}`);

        if (!currentChatId) {
          isNewChat = true;
          const initialTitle =
            typeof input.content === "string"
              ? input.content.substring(0, 50)
              : input.content.find((part) => part.type === "text")?.text?.substring(0, 50) || "New Chat";
          
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
          currentChatId = newChat.id;
          enqueue({ event: 'chatCreated', data: { chatId: currentChatId } });
        } else {
          const [existingChat] = await db
            .select({ userId: chats.userId })
            .from(chats)
            .where(eq(chats.id, currentChatId))
            .limit(1);

          if (!existingChat) {
            throw new Error("Chat not found.");
          }
          if (existingChat.userId !== userId) {
            throw new Error("You are not authorized to access this chat.");
          }
        }
        
        const userMessageContentType = typeof input.content === "string" ? "text" : "parts";
        const userMessageContentForDb =
          typeof input.content === "string"
            ? input.content
            : JSON.stringify(input.content);

        const userMessageId = crypto.randomUUID();
        await db.insert(messages).values({
          id: userMessageId,
          chatId: currentChatId,
          role: "user",
          contentType: userMessageContentType,
          content: userMessageContentForDb,
          parentId: input.parentMessageId,
        });

        const formattedMessagesForLlm: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
        let currentMessageIdForHistory = input.parentMessageId;
        while (currentMessageIdForHistory) {
          const [messageNode] = await db
            .select({
              role: messages.role,
              content: messages.content,
              contentType: messages.contentType,
              parentId: messages.parentId,
            })
            .from(messages)
            .where(eq(messages.id, currentMessageIdForHistory))
            .limit(1);
          
          if (!messageNode) break;

          console.log(`[API] Formatted ${formattedMessagesForLlm.length} messages for the LLM.`);

          formattedMessagesForLlm.unshift({
            role: messageNode.role as "user" | "assistant",
            content:
              messageNode.contentType === "parts"
                ? JSON.parse(messageNode.content)
                : messageNode.content,
          });
          currentMessageIdForHistory = messageNode.parentId;
        }

        const userMessageForLlm = {
          role: "user" as const,
          content: (userMessageContentType === "text" 
            ? userMessageContentForDb 
            : JSON.parse(userMessageContentForDb)
          ) as string | OpenAI.Chat.Completions.ChatCompletionContentPart[]
        };
        formattedMessagesForLlm.push(userMessageForLlm);

        let aiResponseContent = "";
        const aiMessageId = crypto.randomUUID();

        console.log(`[API] Calling OpenRouter with model: ${input.model}...`);

        const openrouterResponse = await openrouter.chat.completions.create({
          model: input.model,
          messages: formattedMessagesForLlm,
          stream: true,
        });

        console.log("[API] Connection to OpenRouter established, starting stream...");

        let chunkCount = 0;
        for await (const chunk of openrouterResponse) {
            chunkCount++;
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            aiResponseContent += content;
            enqueue({ event: 'chunk', data: { content } });
          }
        }

        console.log(`[API] Stream from OpenRouter finished. Received ${chunkCount} chunks.`);
        if (chunkCount === 0 || !aiResponseContent) {
          throw new Error("No content received from AI model despite a successful stream.");
        }

        if (!aiResponseContent) {
          throw new Error("No content received from the AI model.");
        }
        
        await db.insert(messages).values({
          id: aiMessageId,
          chatId: currentChatId,
          role: "assistant",
          contentType: "text",
          content: aiResponseContent,
          parentId: userMessageId,
        });

        console.log(`[API] Saved full AI response to DB.`);

        if (isNewChat) {
          const finalTitle = aiResponseContent.substring(0, 50) || "New Chat";
          await db
            .update(chats)
            .set({ title: finalTitle })
            .where(eq(chats.id, currentChatId));
        }
        
        console.log("[API] Stream finished successfully. Closing controller.");
        enqueue({ event: 'end', data: { userMessageId, aiMessageId } });
        controller.close();
      },
      cancel() {
        console.log("Stream canceled by client.");
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("[CHAT_POST_API]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return new NextResponse(errorMessage, { status: 500 });
  }
}