import { z } from "zod";
import gen from "random-seed";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const bingoBoardRouter = createTRPCRouter({
  getRandomSquares: protectedProcedure.query(async ({ ctx }) => {
    // generate a hash using the user's id and the current date in utc
    const hash = ctx.session.user.id + new Date().getDate();
    const squares = await ctx.db.bingoSquare.findMany();
    const randomSquares: {
        id: number;
        content: string;
        isActive: boolean;
    }[] = [];
    const seeded = gen.create(hash);
    // populate the set with 25 random squares using the hash to make the random selection deterministic
    while (randomSquares.length < 25) {
        const randomSquare = squares[seeded.intBetween(0, squares.length - 1)];
        if (randomSquares.some(x => x.id === randomSquare!.id)) continue;
        randomSquares.push({...randomSquare!});
    }
    return randomSquares;
  }),

  list: adminProcedure.query(async ({ ctx }) => {
    const squares = await ctx.db.bingoSquare.findMany();
    return squares;
  }),

  createSquare: adminProcedure.input(
    z.object({
      content: z.string(),
    }),
  ).mutation(async ({ ctx, input }) => {
    const square = await ctx.db.bingoSquare.create({
      data: input,
    });
    return square;
  }),

  updateSquare: adminProcedure.input(
    z.object({id: z.number(), content: z.string(), isActive: z.boolean()}),
  ).mutation(async ({ ctx, input }) => {
    const square = await ctx.db.bingoSquare.update({
      where: { id: input.id },
      data: { content: input.content, isActive: input.isActive },
    });
    return square;
  }),

  deleteSquare: adminProcedure.input(z.number()).mutation(async ({ ctx, input }) => {
    const square = await ctx.db.bingoSquare.delete({
      where: { id: input },
    });
    return square;
  }),
});
