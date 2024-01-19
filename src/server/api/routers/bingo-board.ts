import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
} from "~/server/api/trpc";

export const bingoSquaresRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    const squares = await ctx.db.bingoSquare.findMany();
    return squares;
  }),

  create: adminProcedure.input(
    z.object({
      content: z.string(),
    }),
  ).mutation(async ({ ctx, input }) => {
    const square = await ctx.db.bingoSquare.create({
      data: input,
    });
    return square;
  }),

  updateContent: adminProcedure.input(
    z.object({id: z.number(), content: z.string()}),
  ).mutation(async ({ ctx, input }) => {
    const square = await ctx.db.bingoSquare.update({
      where: { id: input.id },
      data: { content: input.content },
    });
    return square;
  }),

  activateSquare: adminProcedure.input(z.number()).mutation(async ({ ctx, input }) => {
    const square = await ctx.db.bingoSquare.update({
      where: { id: input },
      data: { isActive: true },
    });

    const userSquares = await ctx.db.userBingoGameSquare.findMany({
      select: { 
        userBingoGameId: true,
        userBingoGame: {
          select: {
            squares: {
              select: {
                bingoSquare: {
                  select: {
                    isActive: true
                  }
                },
                id: true,
              },
              orderBy: {
                id: "asc"
              }
            },
          }
        }
      },
      where: { 
        bingoSquareId: input, 
        userBingoGame: {
          bingoGame: {
            createdAt: {
              gte: new Date(Date.now() - 1000 * 60 * 60 * 12)
            }
          }
        }
      },
    });

    const winners = userSquares.map(userSquare => {
      const squaresInBingo = getBingoSquares(userSquare.userBingoGame.squares.map(x => x.bingoSquare.isActive))
      if (squaresInBingo.length) {
        return {
          id: userSquare.userBingoGameId,
          squares: userSquare.userBingoGame.squares.filter(x => squaresInBingo.includes(x.id)),
        }
      }
    });

    await ctx.db.userBingoGame.updateMany({
      data: {
        hasBingo: true,
      },
      where: {
        id: {
          in: winners.map(x => x!.id)
        }
      }
    })

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

export function getBingoSquares(data: boolean[]) {
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
    if (data[b!]! && data[i!]! && data[n!]! && data[g!]! && data[o!]!) {
      indexesInBingo.push(b!, i!, n!, g!, o!);
    }
  });
  return indexesInBingo;
}
