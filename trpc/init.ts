import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { cache } from "react";
import superjson from "superjson";

export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  const session = await auth();

  return { userId: session?.user?.id ?? null };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async function isProtected(
  opts
) {
  const { ctx } = opts;

  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, ctx.userId))
    .limit(1);

  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  return opts.next({
    ctx: {
      ...ctx,
      user,
    },
  });
});
