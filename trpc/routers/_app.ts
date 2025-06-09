import { AuthRouter } from '@/modules/auth/server/procedure';
import { createTRPCRouter } from '../init';


export const appRouter = createTRPCRouter({
    auth: AuthRouter,
});

export type AppRouter = typeof appRouter;