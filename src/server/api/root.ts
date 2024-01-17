import { createTRPCRouter } from "~/server/api/trpc";
import { bingoBoardRouter } from "~/server/api/routers/bingo-board";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  bingoBoard: bingoBoardRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
