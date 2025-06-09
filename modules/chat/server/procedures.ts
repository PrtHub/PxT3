import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const ChatRouter = createTRPCRouter({
    createChat: protectedProcedure
    .input(z.object({
        model: z.string(),
        content: z.string(),
    }))
    .mutation(async ({ ctx }) => {
        const { userId } = ctx;

        if (!userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
        }



    })
});
