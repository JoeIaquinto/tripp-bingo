import { z } from "zod";
import gen from "random-seed";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
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
        inBingo: boolean;
    }[] = [];
    const seeded = gen.create(hash);
    // populate the set with 25 random squares using the hash to make the random selection deterministic
    while (randomSquares.length < 25) {
        const randomSquare = squares[seeded.intBetween(0, squares.length - 1)];
        if (randomSquares.some(x => x.id === randomSquare!.id)) continue;
        randomSquares.push({...randomSquare!, inBingo: false});
    }

    const bingoSquares = getBingoSquares(randomSquares);
    if (bingoSquares.length !== 0) {
      await ctx.db.bingoState.update({
        where: { id: 1 },
        data: { state: true, message: getBingoWinnerMessage(ctx.session.user.name!, bingoSquares, randomSquares), winner: ctx.session.user.name! },
      
      })
    }
    return randomSquares.map((x, index) => {
      return {...x, inBingo: bingoSquares.includes(index)};
    });
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

  activateSquare: adminProcedure.input(z.number()).mutation(async ({ ctx, input }) => {
    const square = await ctx.db.bingoSquare.update({
      where: { id: input },
      data: { isActive: true },
    });
    return square;
  }),

  deactivateSquare: adminProcedure.input(z.number()).mutation(async ({ ctx, input }) => {
    const square = await ctx.db.bingoSquare.update({
      where: { id: input },
      data: { isActive: false },
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

function getBingoSquares(data: {isActive: boolean}[]) {
  const lines = [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10,11,12,13,14],
    [15,16,17,18,19],
    [20,21,22,23,24],
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20]
  ];
  const indexesInBingo: number[] = [];
  lines.forEach(line => {
    const [b, i, n, g, o] = line;
    if (data[b!]!.isActive && data[i!]!.isActive && data[n!]!.isActive && data[g!]!.isActive && data[o!]!.isActive) {
      indexesInBingo.push(b!, i!, n!, g!, o!);
    }
  });
  return indexesInBingo;
}

function getBingoWinnerMessage(userName: string, bingoSquares: number[], randomSquares: {content: string}[]) {
  return `${userName} has won bingo! They got ${bingoSquares.map(x => randomSquares[x]!.content).join(", ")}`;
}
