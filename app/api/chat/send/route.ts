import { z } from "zod";
import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { Modality } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { auth } from "@/auth";
import { chats, messages, attachments } from "@/db/schema";
import { getGeminiClient } from "@/lib/gemini";
import { getOpenRouterClient } from "@/lib/open-router";
import { imagekit } from "@/lib/image-kit";

const getErrorMessageForStatusCode = (status: number): string => {
  switch (status) {
    case 400:
      return "Invalid input. Please try again.";
    case 401:
      return "Your API key is invalid or expired. Please update it.";
    case 402:
      return "You’ve run out of credits. Top up to continue.";
    case 403:
      return "Your input was flagged by moderation. Try rephrasing.";
    case 408:
      return "Request timed out. Please try again.";
    case 429:
      return "You’re sending too many requests. Please wait and try again.";
    case 503:
      return "Service unavailable. Try again in a few seconds.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
};

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

const attachmentSchema = z.object({
  fileId: z.string(),
  name: z.string(),
  size: z.number(),
  fileType: z.string(),
  url: z.string().url(),
  thumbnailUrl: z.string().url(),
  width: z.number().optional(),
  height: z.number().optional(),
  filePath: z.string(),
});

const messageContentInputSchema = z.union([
  z.string().min(1, "Message content cannot be empty."),
  z
    .array(chatContentPartSchema)
    .min(1, "Message content array cannot be empty."),
]);

const sendMessageInputSchema = z.object({
  chatId: z.string(),
  content: messageContentInputSchema.optional(),
  model: z.string(),
  apiKey: z.string().optional().nullable(),
  geminiApiKey: z.string().optional().nullable(),
  parentMessageId: z.string().optional().nullable(),
  attachments: z.array(attachmentSchema).optional().default([]),
  isRetry: z.boolean().optional().default(false),
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

    console.log(`[API] Input: ${JSON.stringify(input)}`);

    const isGeminiImageModel = input.model.includes("image");

    if (isGeminiImageModel) {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const enqueue = (data: object) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          };

          try {
            const currentChatId = input.chatId;

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

            let userMessageId: string | null = null;
            if (input.content && !input.isRetry) {
              userMessageId = crypto.randomUUID();
              await db.insert(messages).values({
                id: userMessageId,
                chatId: currentChatId,
                role: "user",
                content: typeof input.content === "string" ? input.content : JSON.stringify(input.content),
                contentType: typeof input.content === "string" ? "text" : "image",
                parentId: input.parentMessageId ?? null,
              });

              enqueue({
                event: "userMessageCreated",
                data: { userMessageId: userMessageId },
              });
            } else if (input.isRetry) {
              userMessageId = input.parentMessageId ?? null;
            }

            const genAI = getGeminiClient(input.geminiApiKey);
            const prompt =
              typeof input.content === "string"
                ? input.content
                : "Generate an image based on the context.";

            const result = await genAI.models.generateContent({
              model: input.model,
              contents: prompt,
              config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
              },
            });

            const imagePart = result.candidates?.[0]?.content?.parts?.find(
              (p) => !!p.inlineData
            );

            if (imagePart && imagePart.inlineData) {
              const imageData = imagePart.inlineData.data;

              const uploadResult = await imagekit.upload({
                file: imageData ?? "",
                fileName: `gemini-image-${Date.now()}.jpg`,
                folder: `/chat_images`,
                isPrivateFile: false,
                useUniqueFileName: true,
              });

              const aiMessageId = crypto.randomUUID();
              await db.insert(messages).values({
                id: aiMessageId,
                chatId: currentChatId,
                role: "assistant",
                content: uploadResult.url,
                contentType: "image",
                parentId: userMessageId,
              });

              enqueue({
                event: "image_generated",
                data: uploadResult.url,
              });
            } else {
              const text = result.text;
              if (text) {
                const aiMessageId = crypto.randomUUID();
                await db.insert(messages).values({
                  id: aiMessageId,
                  chatId: currentChatId,
                  role: "assistant",
                  contentType: "text",
                  content: text,
                  parentId: userMessageId,
                });
                enqueue({ event: "chunk", data: { content: text } });
              } else {
                throw new Error("No image or text content generated.");
              }
            }

            enqueue({ event: "end", data: {} });
            controller.close();
          } catch (error) {
            console.error("[GEMINI_STREAM_ERROR]", error);
            const status = error instanceof OpenAI.APIError ? error.status || 500 : 500;
            const message = getErrorMessageForStatusCode(status);

            enqueue({
              event: "error",
              data: { message: message, status: status },
            });
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const openrouter = getOpenRouterClient(input.apiKey);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const enqueue = (data: object) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          const currentChatId = input.chatId;

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

          let userMessageId: string | null = null;
          if (input.content && !input.isRetry) {
            const userMessageContentType =
              typeof input.content === "string" ? "text" : "parts";
            const userMessageContentForDb =
              typeof input.content === "string"
                ? input.content
                : JSON.stringify(input.content);

            userMessageId = crypto.randomUUID();
            await db.insert(messages).values({
              id: userMessageId,
              chatId: currentChatId,
              role: "user",
              contentType: userMessageContentType,
              content: userMessageContentForDb,
              parentId: input.parentMessageId,
            });

            if (input.attachments && input.attachments.length > 0) {
              await Promise.all(
                input.attachments.map((attachment) =>
                  db.insert(attachments).values({
                    id: crypto.randomUUID(),
                    messageId: userMessageId as string,
                    userId: userId,
                    storageKey: attachment.fileId,
                    url: attachment.url,
                    filename: attachment.name,
                    mimeType: attachment.fileType || "application/octet-stream",
                    size: attachment.size,
                    status: "completed",
                  })
                )
              );
            }

            enqueue({
              event: "userMessageCreated",
              data: { userMessageId: userMessageId },
            });
          } else if (input.isRetry) {
            userMessageId = input.parentMessageId ?? ''
          }

          const chatMessages = await db
            .select({
              role: messages.role,
              content: messages.content,
              contentType: messages.contentType,
            })
            .from(messages)
            .where(eq(messages.chatId, currentChatId))
            .orderBy(messages.createdAt);

          const formattedMessagesForLlm: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = chatMessages.map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.contentType === "parts" ? JSON.parse(msg.content) : msg.content,
          }));

          if (input.content) {
            const messageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
              {
                type: "text",
                text: typeof input.content === "string" ? input.content : JSON.stringify(input.content)
              }
            ];

            if (input.attachments && input.attachments.length > 0) {
              input.attachments.forEach(attachment => {
                messageContent.push({
                  type: "image_url",
                  image_url: {
                    url: attachment.url,
                    detail: "auto"
                  }
                });
              });
            }

            const userMessageForLlm = {
              role: "user" as const,
              content: messageContent
            };
            formattedMessagesForLlm.push(userMessageForLlm);
          }

          let aiResponseContent = "";
          const aiMessageId = crypto.randomUUID();

          console.log(`[API] Calling OpenRouter with model: ${input.model}...`);
          console.log(`[API] Using API key: ${input.apiKey}`);

          const openrouterResponse = await openrouter.chat.completions.create({
            model: input.model,
            messages: formattedMessagesForLlm,
            stream: true,
            tools: input.webSearch?.enabled
              ? [
                  {
                    type: "function",
                    function: {
                      name: "web_search",
                      description: `Search the web for up-to-date information across both programming and general topics as well as news. This is particularly useful for:
Programming & Development:
- Finding the latest documentation, APIs, and SDK versions
- Researching framework updates, breaking changes, or security patches
- Getting current best practices and modern solutions to coding problems
- Looking up error messages and debugging specific issues
- Finding code examples, tutorials, and implementation guides
- Checking compatibility between different libraries and dependencies
- Verifying web standards and browser support
General Knowledge:
- Getting current news and recent events
- Researching products, services, or companies
- Finding how-to guides and tutorials
- Looking up facts and verifying information
- Getting weather forecasts and time-sensitive data
- Exploring topics in science, technology, and other fields`,
                      parameters: {
                        type: "object",
                        properties: {
                          query: {
                            type: "string",
                            description: "The search query",
                          },
                        },
                        required: ["query"],
                      },
                    },
                  },
                ]
              : undefined,
            tool_choice: input.webSearch?.enabled ? "auto" : undefined,
          });

          let chunkCount = 0;
          let toolCallBuffer = "";

          for await (const chunk of openrouterResponse) {
            chunkCount++;

            if (chunk.choices[0]?.delta?.tool_calls) {
              const toolCall = chunk.choices[0].delta.tool_calls[0];
              if (toolCall.function) {
                if (toolCall.function.name) {
                  toolCallBuffer = "";
                }
                if (toolCall.function.arguments) {
                  toolCallBuffer += toolCall.function.arguments;
                  try {
                    const args = JSON.parse(toolCallBuffer);
                    if (args.query) {
                      formattedMessagesForLlm.push({
                        role: "assistant",
                        content: `Searching the web for: ${args.query}`,
                      });
                      toolCallBuffer = "";
                    }
                  } catch {
                    console.error("Error parsing tool call arguments");
                  }
                }
              }
            }

            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              aiResponseContent += content;
              enqueue({ event: "chunk", data: { content } });
            }
          }

          if (chunkCount === 0 || !aiResponseContent) {
            throw new Error(
              "No content received from AI model despite a successful stream."
            );
          }

          const parentIdForAssistant = userMessageId || input.parentMessageId;

          await db.insert(messages).values({
            id: aiMessageId,
            chatId: currentChatId,
            role: "assistant",
            contentType: "text",
            content: aiResponseContent,
            parentId: parentIdForAssistant,
          });

          enqueue({
            event: "end",
            data: { userMessageId: userMessageId, aiMessageId: aiMessageId },
          });
          controller.close();
        } catch (error) {
            console.error("[OPENROUTER_STREAM_ERROR]", error);
            const status = error instanceof OpenAI.APIError ? error.status || 500 : 500;
            const message = getErrorMessageForStatusCode(status);

            enqueue({
              event: "error",
              data: { message: message, status: status },
            });
            controller.close();
        }
      },
      cancel() {
        console.log("Stream canceled by client.");
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[CHAT_POST_API] Error:", error);

    if (error instanceof z.ZodError) {
      const message = getErrorMessageForStatusCode(400);
      return new NextResponse(
        JSON.stringify({
          error: message,
          details: error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof OpenAI.APIError) {
      const status = error.status || 500;
      const message = getErrorMessageForStatusCode(status);
      return new NextResponse(JSON.stringify({ error: message }), {
        status: status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const errorMessage = getErrorMessageForStatusCode(500);

    return new NextResponse(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
