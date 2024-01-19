import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const userBingoRouter = createTRPCRouter({
  listUserGames: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findFirst({ where: { id: ctx.session.user.id } });
    if (!user) {
      throw new Error("User not found");
    }
    const games = await ctx.db.userBingoGame.findMany(
      { 
        where: { 
          userId: user.id,
          bingoGame: {
            createdAt: {
              gte: new Date(new Date().getTime() - 60 * 60 * 1000 * 6)
            }
          } 
        },
      include: { bingoGame: true } });
    return games;
  }),

  leaveGame: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const game = await ctx.db.bingoGame.findFirst({ where: { id: input.id } });
    if (!game) {
      throw new Error("Game not found");
    }
    const user = await ctx.db.user.findFirst({ where: { id: ctx.session.user.id } });
    if (!user) {
      throw new Error("User not found");
    }
    const userGame = await ctx.db.userBingoGame.findFirst({ where: { userId: user.id, bingoGameId: game.id } });
    if (!userGame) {
      throw new Error("User not in game");
    }
    await ctx.db.userBingoGame.delete( { where: { id: userGame.id } });
  }),
});