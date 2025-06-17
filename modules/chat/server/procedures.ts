import { db } from "@/db";
import { attachments, chats, messages } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";

export const ChatRouter = createTRPCRouter({
  getChatsForUser: protectedProcedure
    .input(
      z.object({
        searchQuery: z.string().optional().nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { searchQuery } = input;

      if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const userChats = await db
        .select({
          id: chats.id,
          title: chats.title,
          createdAt: chats.createdAt,
          updatedAt: chats.updatedAt,
          parentChatId: chats.parentChatId,
          branchedFromMessageId: chats.branchedFromMessageId,
          branchName: chats.branchName,
        })
        .from(chats)
        .where(eq(chats.userId, userId))
        .orderBy(desc(chats.updatedAt));

      if (searchQuery) {
        const filteredChats = userChats.filter((chat) =>
          chat.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return filteredChats;
      }

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
        branchName: existingChat.branchName,
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

      await db.update(chats).set({ title }).where(eq(chats.id, chatId));
    }),

  searchChats: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1, "Search query cannot be empty"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { query } = input;

      try {
        if (!userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }

        const searchQuery = db
          .select({
            id: chats.id,
            title: chats.title,
            userId: chats.userId,
            updatedAt: chats.updatedAt,
          })
          .from(chats);

        const filteredQuery = searchQuery.where(
          and(
            eq(chats.userId, userId as string),
            ilike(chats.title, `%${query}%`)
          )
        );

        const results = await filteredQuery.orderBy(desc(chats.updatedAt));
        return results;
      } catch (error) {
        console.error("Error searching chats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search chats",
        });
      }
    }),
  getAttachments: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { messageId } = input;

      try {
        if (!userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }

        const [message] = await db
          .select({
            id: messages.id,
          })
          .from(messages)
          .where(eq(messages.id, messageId))
          .limit(1);

        if (!message) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Message not found",
          });
        }

        const allAttachments = await db
          .select({
            id: attachments.id,
            name: attachments.filename,
            url: attachments.url,
          })
          .from(attachments)
          .where(eq(attachments.messageId, message.id))
          .limit(2);

        return allAttachments;
      } catch (error) {
        console.error("Error getting attachments:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get attachments",
        });
      }
    }),
  deleteChat: protectedProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { chatId } = input;

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
          message: "You are not authorized to delete this chat.",
        });
      }

      const branchedChats = await db
        .select()
        .from(chats)
        .where(eq(chats.parentChatId, chatId));

      if (branchedChats.length > 0) {
        await Promise.all(
          branchedChats.map((chat) =>
            db
              .update(chats)
              .set({
                parentChatId: null,
                branchedFromMessageId: null,
                branchName: null,
              })
              .where(eq(chats.id, chat.id))
          )
        );
      }

      await db.delete(chats).where(eq(chats.id, chatId));

      return {
        success: true,
      };
    }),
  deleteMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { messageId } = input;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      await db.delete(messages).where(eq(messages.id, messageId));
      await db.delete(messages).where(eq(messages.parentId, messageId));
      await db.delete(attachments).where(eq(attachments.messageId, messageId));

      return { success: true };
    }),
  deleteAIMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { messageId } = input;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      await db
        .delete(messages)
        .where(
          and(eq(messages.id, messageId), eq(messages.role, "assistant"))
        );

      return { success: true };
    }),
    getOneMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { messageId } = input;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const [existingMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (!existingMessage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found.",
        });
      }

      // const [existingParentMessage] = await db
      //   .select()
      //   .from(messages)
      //   .where(eq(messages.id, existingMessage.parentId || ""))
      //   .limit(1);

      // if (!existingParentMessage) {
      //   throw new TRPCError({
      //     code: "NOT_FOUND",
      //     message: "Parent message not found.",
      //   });
      // }

      return existingMessage;
    }),
});
