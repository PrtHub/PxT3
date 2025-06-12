import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { openrouter } from "@/lib/open-router";
import {  createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { asc, desc, eq } from "drizzle-orm";
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

export const ChatRouter = createTRPCRouter({
  sendMessage: protectedProcedure
    .input(
      z.object({
        chatId: z.string().optional(),
        content: messageContentInputSchema,
        model: z.string().default("google/gemini-2.0-flash-exp:free"),
        parentMessageId: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      let currentChatId = input.chatId;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const initialTitle =
        typeof input.content === "string"
          ? input.content.substring(0, 50)
          : input.content
              .find((part) => part.type === "text")
              ?.text?.substring(0, 50) || "New Chat";

      let isNewChat = false;
      if (!currentChatId) {
        isNewChat = true;
        const [newChat] = await db
          .insert(chats)
          .values({
            id: crypto.randomUUID(),
            userId,
            title: initialTitle,
            shareId: crypto.randomUUID(),
            isPublic: false,
          })
          .returning({ id: chats.id });

        if (!newChat?.id) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create new chat.",
          });
        }
        currentChatId = newChat.id;
      } else {
        const [existingChat] = await db
          .select({ userId: chats.userId })
          .from(chats)
          .where(eq(chats.id, currentChatId))
          .limit(1);

        if (!existingChat) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Chat not found.",
          });
        }

        if (existingChat.userId !== userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You are not authorized to access this chat.",
          });
        }
      }

      const userMessageContentType =
        typeof input.content === "string" ? "text" : "parts";
      const userMessageContentForDb =
        typeof input.content === "string"
          ? input.content
          : JSON.stringify(input.content);

      const userMessageId = crypto.randomUUID();
      const [newMessage] = await db
        .insert(messages)
        .values({
          id: userMessageId,
          chatId: currentChatId,
          role: "user",
          contentType: userMessageContentType,
          content: userMessageContentForDb,
          parentId: input.parentMessageId,
        })
        .returning({ id: messages.id });

      if (!newMessage?.id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create new message.",
        });
      }

      const formattedMessagesForLlm: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        [];
      let currentMessageIdForHistory = input.parentMessageId;

      while (currentMessageIdForHistory) {
        const [messageNode] = await db
          .select({
            id: messages.id,
            role: messages.role,
            content: messages.content,
            contentType: messages.contentType,
            parentId: messages.parentId,
          })
          .from(messages)
          .where(eq(messages.id, currentMessageIdForHistory))
          .limit(1);

        if (!messageNode) {
          break;
        }

        formattedMessagesForLlm.unshift({
          tool_call_id: "",
          role: messageNode.role as "user" | "assistant" | "system" | "tool",
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
          : JSON.parse(userMessageContentForDb)) as
          | string
          | OpenAI.Chat.Completions.ChatCompletionContentPart[],
      };

      formattedMessagesForLlm.push(userMessageForLlm);

      let aiResponseContent = "";

      try {
        const openrouterResponse = await openrouter.chat.completions.create({
          model: input.model,
          messages: formattedMessagesForLlm,
          stream: true,
        });

        for await (const chunk of openrouterResponse) {
          aiResponseContent += chunk.choices[0]?.delta?.content || "";
        }

        if (!aiResponseContent) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No content received from AI model.",
          });
        }
      } catch (error) {
        console.error("Error calling OpenRouter API:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get response from AI model.",
          cause: error,
        });
      }

      const aiMessageId = crypto.randomUUID();
      await db.insert(messages).values({
        id: aiMessageId,
        chatId: currentChatId,
        role: "assistant",
        contentType: "text",
        content: aiResponseContent,
        parentId: userMessageId,
      });

      if (isNewChat) {
        await db
          .update(chats)
          .set({ title: initialTitle })
          .where(eq(chats.id, currentChatId));
      }

      return {
        chatId: currentChatId,
        aiMessage: {
          id: aiMessageId,
          content: [{ type: "text", text: aiResponseContent }],
          role: "assistant",
        },
        userMessageId: userMessageId,
      };
    }),

  getChatsForUser: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const userChats = await db
      .select({
        id: chats.id,
        title: chats.title,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
      })
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt));

    return userChats;
  }),

  getMessagesInChat: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { chatId } = input;

      const [chat] = await db
        .select({
          id: chats.id,
          userId: chats.userId,
        })
        .from(chats)
        .where(eq(chats.id, chatId))
        .limit(1);

      if (!chat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found.",
        });
      }

      if (chat.userId !== userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to view this chat.",
        });
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
        let parsedContent:
          | { type: string }[]
          | OpenAI.Chat.Completions.ChatCompletionContentPart[];
        if (message.contentType === "text") {
          parsedContent = [{ type: "text", text: message.content }];
        } else {
          try {
            parsedContent = JSON.parse(message.content);
          } catch {
            parsedContent = [
              { type: "text", text: "[Error displaying content]" },
            ];
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

      return formattedMessages;
    }),

  getOneChat: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .query(async ({ input }) => {
      const { chatId } = input;

      const [existingChat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, chatId))
        .limit(1);

      if (!existingChat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found.",
        });
      }

      return {
        title: existingChat.title,
        userId: existingChat.userId,
      };
    }),

  shareChat: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { chatId } = input;

      const [existingChat] = await db
        .select({
          id: chats.id,
          userId: chats.userId,
          shareId: chats.shareId,
        })
        .from(chats)
        .where(eq(chats.id, chatId))
        .limit(1);

      if (!existingChat) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat not found.",
        });
      }

      if (existingChat.userId !== userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to share this chat.",
        });
      }

      await db
        .update(chats)
        .set({ isPublic: true })
        .where(eq(chats.id, chatId));

      return {
        url: `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/share/${existingChat.shareId}`,
      };
    }),
    editChatTitle: protectedProcedure
      .input(
        z.object({
          chatId: z.string(),
          title: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { userId } = ctx;
        const { chatId, title } = input;

        const [existingChat] = await db
          .select({
            id: chats.id,
            userId: chats.userId,
          })
          .from(chats)
          .where(eq(chats.id, chatId))
          .limit(1);

        if (!existingChat) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Chat not found.",
          });
        }

        if (existingChat.userId !== userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You are not authorized to edit this chat.",
          });
        }

        await db
          .update(chats)
          .set({ title })
          .where(eq(chats.id, chatId));
      }),
});
