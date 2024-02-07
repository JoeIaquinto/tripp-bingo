import { createTRPCRouter } from "~/server/api/trpc";
import { gameRouter } from "~/server/api/routers/game";
import { baseSquareRouter } from "~/server/api/routers/base-squares";
import { sportEventRouter } from "~/server/api/routers/sport-events";
import { bingoPatternsRouter } from "~/server/api/routers/bingo-patterns";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  baseSquares: baseSquareRouter,
  game: gameRouter,
  sports: sportEventRouter,
  bingoPatterns: bingoPatternsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
