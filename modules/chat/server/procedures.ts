import { db } from "@/db";
import { attachments, chats, messages } from "@/db/schema";
import {  createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";


export const ChatRouter = createTRPCRouter({
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
      uploadAttachment: protectedProcedure
      .input(
        z.object({
          messageId: z.string(),
          filename: z.string(),
          mimeType: z.string(),
          size: z.number(),
          base64Content: z.string(), // Keep this for future actual upload
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { userId } = ctx;
        const { messageId, filename, mimeType, size } = input;

        if (!userId) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        // 1. Verify messageId exists and get its chatId
        const [existingMessage] = await db
          .select({
            id: messages.id,
            chatId: messages.chatId,
          })
          .from(messages)
          .where(eq(messages.id, messageId))
          .limit(1);

        if (!existingMessage) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Message not found.",
          });
        }

        const [owningChat] = await db
          .select({
            userId: chats.userId,
          })
          .from(chats)
          .where(eq(chats.id, existingMessage.chatId))
          .limit(1);

        if (!owningChat || owningChat.userId !== userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You are not authorized to add attachments to this message.",
          });
        }

        const simulatedStorageKey = `attachments/${crypto.randomUUID()}-${filename}`;
        const simulatedUrl = `https://example.com/${simulatedStorageKey}`;

        const [newAttachment] = await db
          .insert(attachments)
          .values({
            id: crypto.randomUUID(),
            userId: userId,
            messageId: messageId,
            storageKey: simulatedStorageKey,
            url: simulatedUrl,
            filename: filename,
            mimeType: mimeType,
            size: size,
            status: "completed",
          })
          .returning();

        return newAttachment;
      }),
});
