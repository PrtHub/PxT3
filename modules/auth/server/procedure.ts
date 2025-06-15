import { createTRPCRouter } from "@/trpc/init";
import { db } from "@/db";
import { chats, messages, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "@/trpc/init";
import { z } from "zod";

export const AuthRouter = createTRPCRouter({
  getOne: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return existingUser;
  }),
  getUserWithChatsAndMessages: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;

      if (input.userId !== userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // First get the user
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!existingUser) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Then get the counts in separate queries
      const [chatCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(chats)
        .where(eq(chats.userId, input.userId));

      const [messageCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(messages)
        .innerJoin(chats, eq(messages.chatId, chats.id))
        .where(eq(chats.userId, input.userId));

      // Combine the results
      const result = {
        ...existingUser,
        chatCount: chatCount?.count ?? 0,
        messageCount: messageCount?.count ?? 0,
      };

      return result;
    }),
});
