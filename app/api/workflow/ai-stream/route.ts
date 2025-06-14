import { serve } from "@upstash/workflow/nextjs";
import { z } from "zod";
import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { Modality } from "@google/genai";

import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { getGeminiClient } from "@/lib/gemini";
import { getOpenRouterClient } from "@/lib/open-router";
import { imagekit } from "@/lib/image-kit";
import { redis } from "@/lib/upstash";

const streamInputSchema = z.object({
  chatId: z.string(),
  content: z.union([
    z.string().min(1),
    z.array(z.object({
      type: z.literal("text").or(z.literal("image_url")),
      text: z.string().optional(),
      image_url: z.object({
        url: z.string().url(),
        detail: z.enum(["low", "high", "auto"]).optional(),
      }).optional(),
    }))
  ]).optional(),
  model: z.string(),
  apiKey: z.string().optional().nullable(),
  geminiApiKey: z.string().optional().nullable(),
  parentMessageId: z.string().optional().nullable(),
  userId: z.string(),
  userMessageId: z.string().optional(),
  webSearch: z.object({
    enabled: z.boolean().default(false),
    maxResults: z.number().min(1).max(10).optional().default(5),
  }).optional().default({ enabled: false }),
});


async function updateStreamState(chatId: string, state: any) {
  await redis.setex(`stream:${chatId}`, 3600, JSON.stringify(state)); // 1 hour TTL
}

// async function getStreamState(chatId: string) {
//   const state = await redis.get(`stream:${chatId}`);
//   return state ? JSON.parse(state as string) : null;
// }

async function publishStreamEvent(chatId: string, event: any) {
  await redis.publish(`stream:${chatId}`, JSON.stringify(event));
}

export const { POST } = serve(
  async (context) => {
    const input = streamInputSchema.parse(context.requestPayload);
    const { chatId, content, model, apiKey, geminiApiKey, parentMessageId, userId, userMessageId, webSearch } = input;
    
    console.log(`[WORKFLOW] Starting AI stream for chat: ${chatId}`);
    
    try {
      await updateStreamState(chatId, {
        status: "starting",
        chatId,
        model,
        startedAt: new Date().toISOString(),
      });

      // Verify chat ownership
      const [existingChat] = await db
        .select({ userId: chats.userId })
        .from(chats)
        .where(eq(chats.id, chatId))
        .limit(1);

      if (!existingChat || existingChat.userId !== userId) {
        throw new Error("Chat not found or unauthorized");
      }

      let finalUserMessageId = userMessageId;
      
      // Create user message if content provided
      if (content && !userMessageId) {
        finalUserMessageId = crypto.randomUUID();
        await db.insert(messages).values({
          id: finalUserMessageId,
          chatId,
          role: "user",
          content: typeof content === "string" ? content : JSON.stringify(content),
          contentType: typeof content === "string" ? "text" : "parts",
          parentId: parentMessageId ?? null,
        });

        await publishStreamEvent(chatId, {
          event: "userMessageCreated",
          data: { userMessageId: finalUserMessageId },
        });
      }

      await updateStreamState(chatId, {
        status: "processing",
        chatId,
        model,
        userMessageId: finalUserMessageId,
        startedAt: new Date().toISOString(),
      });

      const isGeminiImageModel = model.includes("image");

      if (isGeminiImageModel) {
        const genAI = getGeminiClient(geminiApiKey);
        const prompt = typeof content === "string" ? content : "Generate an image based on the context.";

        const result = await genAI.models.generateContent({
          model,
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
            chatId,
            role: "assistant",
            content: uploadResult.url,
            contentType: "image",
            parentId: finalUserMessageId,
          });

          await publishStreamEvent(chatId, {
            event: "image_generated",
            data: uploadResult.url,
          });
        } else {
          const text = result.text;
          if (text) {
            const aiMessageId = crypto.randomUUID();
            await db.insert(messages).values({
              id: aiMessageId,
              chatId,
              role: "assistant",
              contentType: "text",
              content: text,
              parentId: finalUserMessageId,
            });
            
            await publishStreamEvent(chatId, {
              event: "chunk",
              data: { content: text },
            });
          }
        }
      } else {
        const openrouter = getOpenRouterClient(apiKey);

        // Build message history
        const formattedMessagesForLlm: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
        let currentMessageIdForHistory = parentMessageId;
        
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

          formattedMessagesForLlm.unshift({
            role: messageNode.role as "user" | "assistant",
            content: messageNode.contentType === "parts" 
              ? JSON.parse(messageNode.content) 
              : messageNode.content,
          });
          currentMessageIdForHistory = messageNode.parentId;
        }

        // Add current user message
        if (content) {
          const messageContent: string | OpenAI.Chat.Completions.ChatCompletionContentPart[] =
            typeof content === "string"
              ? content
              : content
                  .map((part): OpenAI.Chat.Completions.ChatCompletionContentPart | null => {
                    if (part.type === "image_url" && part.image_url) {
                      return {
                        type: "image_url",
                        image_url: part.image_url,
                      };
                    }
                    if (part.type === "text") {
                      return {
                        type: "text",
                        text: part.text ?? "",
                      };
                    }
                    return null;
                  })
                  .filter((p): p is NonNullable<typeof p> => p !== null);

          const userMessageForLlm: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
            role: "user" as const,
            content: messageContent,
          };
          formattedMessagesForLlm.push(userMessageForLlm);
        }

        let aiResponseContent = "";
        const aiMessageId = crypto.randomUUID();

        console.log(`[WORKFLOW] Calling OpenRouter with model: ${model}`);

        const openrouterResponse = await openrouter.chat.completions.create({
          model,
          messages: formattedMessagesForLlm,
          stream: true,
          tools: webSearch?.enabled ? [{
            type: "function",
            function: {
              name: "web_search",
              description: "Search the web for up-to-date information",
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
          }] : undefined,
          tool_choice: webSearch?.enabled ? "auto" : undefined,
        });

        // Process streaming response
        for await (const chunk of openrouterResponse) {
          if (chunk.choices[0]?.delta?.tool_calls) {
            // Handle tool calls (web search)
            const toolCall = chunk.choices[0].delta.tool_calls[0];
            if (toolCall.function?.arguments) {
              try {
                const args = JSON.parse(toolCall.function.arguments);
                if (args.query) {
                  await publishStreamEvent(chatId, {
                    event: "tool_call",
                    data: { type: "web_search", query: args.query },
                  });
                }
              } catch (e) {
                console.error("Error parsing tool call:", e);
              }
            }
          }

          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            aiResponseContent += content;
            
            // Update stream state periodically
            await updateStreamState(chatId, {
              status: "streaming",
              chatId,
              model,
              userMessageId: finalUserMessageId,
              aiMessageId,
              currentContent: aiResponseContent,
              lastUpdated: new Date().toISOString(),
            });

            await publishStreamEvent(chatId, {
              event: "chunk",
              data: { content, fullContent: aiResponseContent },
            });

            // Add small delay to prevent overwhelming
            await context.sleep("sleep", 50);
          }
        }

        // Save final message to database
        const parentIdForAssistant = finalUserMessageId || parentMessageId;
        await db.insert(messages).values({
          id: aiMessageId,
          chatId,
          role: "assistant",
          contentType: "text",
          content: aiResponseContent,
          parentId: parentIdForAssistant,
        });
      }

      await updateStreamState(chatId, {
        status: "completed",
        chatId,
        model,
        completedAt: new Date().toISOString(),
      });

      await publishStreamEvent(chatId, {
        event: "end",
        data: { userMessageId: finalUserMessageId },
      });

      console.log(`[WORKFLOW] Completed AI stream for chat: ${chatId}`);
      
    } catch (error) {
      console.error("[WORKFLOW] Error:", error);
      
      await updateStreamState(chatId, {
        status: "error",
        chatId,
        error: error instanceof Error ? error.message : "Unknown error",
        errorAt: new Date().toISOString(),
      });

      await publishStreamEvent(chatId, {
        event: "error",
        data: { 
          error: error instanceof Error ? error.message : "An unknown error occurred" 
        },
      });
      
      throw error;
    }
  }
);