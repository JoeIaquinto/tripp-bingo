import { createTRPCRouter } from "~/server/api/trpc";
import { gameRouter } from "~/server/api/routers/game";
import { baseSquareRouter } from "./routers/base-squares";
import { sportEventRouter } from "./routers/sport-events";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  baseSquares: baseSquareRouter,
  game: gameRouter,
  sports: sportEventRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
