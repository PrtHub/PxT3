import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { workflowClient, redis } from "@/lib/upstash";

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
  z.array(chatContentPartSchema).min(1, "Message content array cannot be empty."),
]);

const sendMessageInputSchema = z.object({
  chatId: z.string(),
  content: messageContentInputSchema.optional(),
  model: z.string(),
  apiKey: z.string().optional().nullable(),
  geminiApiKey: z.string().optional().nullable(),
  parentMessageId: z.string().optional().nullable(),
  webSearch: z
    .object({
      enabled: z.boolean().default(false),
      maxResults: z.number().min(1).max(10).optional().default(5),
      searchPrompt: z.string().optional(),
    })
    .optional()
    .default({ enabled: false }),
});

export async function POST(req: NextRequest) {
  console.log("\n--- [API /api/chat/send] Received new request ---");
  
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse(
      "Unauthorized: You must be logged in to send a message.",
      { status: 401 }
    );
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const input = sendMessageInputSchema.parse(body);
    console.log(`[API] Parsed input for chatId: ${input.chatId || "new chat"}`);

    // Check if there's already an active stream for this chat
    const existingStreamState = await redis.get(`stream:${input.chatId}`);
    if (existingStreamState) {
      try {
        const streamState = JSON.parse(existingStreamState as string);
        if (streamState.status === "streaming" || streamState.status === "processing") {
          return new NextResponse(
            JSON.stringify({
              error: "A stream is already active for this chat",
              streamState
            }),
            { status: 409 }
          );
        }
      } catch (parseError) {
        console.warn(`[CHAT_SEND_API] Could not parse existing stream state for chat ${input.chatId}:`, parseError);
        // If parsing fails, we assume the stored state is corrupt or invalid,
        // so we don't consider it an active stream that should block a new one.
        // The workflow will create a new, valid stream state.
      }
    }

    // Ensure the workflow URL is properly formatted
    const workflowUrl = 'https://wet-lizards-feel.loca.lt/api/workflow/ai-stream';
    if (!workflowUrl) {
      throw new Error("WORKFLOW_URL environment variable is not set");
    }

    // Start the background workflow
    const workflowRunId = await workflowClient.trigger({
      url: workflowUrl,
      body: {
        chatId: input.chatId,
        content: input.content,
        model: input.model,
        apiKey: input.apiKey,
        geminiApiKey: input.geminiApiKey,
        parentMessageId: input.parentMessageId,
        userId,
        webSearch: input.webSearch,
      },
    });

    console.log(`[API] Started workflow: ${workflowRunId}`);

    // Store workflow ID for potential cancellation
    await redis.setex(`workflow:${input.chatId}`, 3600, workflowRunId);

    return NextResponse.json({
      success: true,
      workflowId: workflowRunId,
      message: "AI response generation started in background",
    });

  } catch (error) {
    console.error("[CHAT_POST_API]", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return new NextResponse(errorMessage, { status: 500 });
  }
}