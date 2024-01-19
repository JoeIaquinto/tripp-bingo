import { createTRPCRouter } from "~/server/api/trpc";
import { bingoSquaresRouter } from "~/server/api/routers/bingo-board";
import { gameRouter } from "~/server/api/routers/game";
import { userBingoRouter } from "~/server/api/routers/user-bingo";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  bingoSquares: bingoSquaresRouter,
  game: gameRouter,
  userBingo: userBingoRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
