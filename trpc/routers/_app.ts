import { AuthRouter } from '@/modules/auth/server/procedure';
import { createTRPCRouter } from '../init';
import { ChatRouter } from '@/modules/chat/server/procedures';


export const appRouter = createTRPCRouter({
    auth: AuthRouter,
    chat: ChatRouter,
});

export type AppRouter = typeof appRouter;