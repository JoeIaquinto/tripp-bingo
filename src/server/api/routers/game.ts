import { z } from "zod";
import gen from "random-seed";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { type PrismaClient } from "@prisma/client";
import { getBingoSquares } from "./bingo-board";

export const gameRouter = createTRPCRouter({
  createGame: adminProcedure.input(z.object({
    title: z.string().max(100).min(1),
  })).mutation(async ({ ctx, input }) => {
    const game = await ctx.db.bingoGame.create({
      data: input,
    });
    return game;
  }),

  joinGuest: publicProcedure.input(z.object({
    id: z.number(),
    name: z.string().max(100).min(1),
  }))
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.bingoGame.findFirst({ where: { id: input.id } });
      if (!game) {
        throw new Error("Game not found");
      }
  
      const randomSquareIds = await generateNewSquares(ctx.db, input.name, game.id)
  
      const userGame = await ctx.db.userBingoGame.create({
        data: {
          bingoGameId: game.id,
          userName: input.name,
          squares: {
            createMany: {
              data: randomSquareIds.map(x => ({ bingoSquareId: x })),
            }
          },
        },
      });
  
      return userGame;
    }),

  joinGame: protectedProcedure.input(z.object({
    id: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const game = await ctx.db.bingoGame.findFirst({ where: { id: input.id } });
    if (!game) {
      throw new Error("Game not found");
    }
    const user = await ctx.db.user.findFirst({ where: { id: ctx.session.user.id } });
    if (!user) {
      throw new Error("User not found");
    }
    const existingUserGame = await ctx.db.userBingoGame.findFirst({ where: { userId: user.id, bingoGameId: game.id } });
    if (existingUserGame) {
      throw new Error("User already in game");
    }

    const randomSquareIds = await generateNewSquares(ctx.db, user.id, game.id)

    const userGame = await ctx.db.userBingoGame.create({
      data: {
        bingoGameId: game.id,
        userId: user.id,
        userName: user.name!,
        squares: {
          createMany: {
            data: randomSquareIds.map(x => ({ bingoSquareId: x })),
          }
        },
      },
    });

    return userGame;
  }),

  getGameInfo: publicProcedure.input(z.object({
    id: z.number(),
  })).query(async ({ ctx, input }) => {
    const game = await ctx.db.bingoGame.findUnique({ where: { id: input.id } });
    if (!game) {
      throw new Error("Game not found");
    }
    const usersInGame = await ctx.db.userBingoGame.findMany({
      where: { bingoGameId: game.id },
      select: {
        hasBingo: true,
        userName: true,
        squares: {
          select: {
            bingoSquare: {
              select: {
                content: true,
                isActive: true
              }
            },
            id: true,
          },
        }
      }
    });

    const gameWithUserStatus = {
      game,
      usersInGame: usersInGame.map(x => ({
        name: x.userName,
        squaresActive: x.squares.filter(y => y.bingoSquare.isActive).length,
        hasBingo: x.hasBingo,
      })),
      anyoneHasBingo: usersInGame.some(x => x.hasBingo),
    }

    return gameWithUserStatus;
  }),

  deleteGame: adminProcedure.input(z.object({id: z.number()})).mutation(async ({ ctx, input }) => {
    const game = await ctx.db.bingoGame.findFirst({ where: { id: input.id } });
    if (!game) {
      throw new Error("Game not found");
    }
    const deleted = await ctx.db.bingoGame.delete({ where: { id: game.id } });
    return deleted;
  }),

  listGames: publicProcedure.query(async ({ ctx }) => {
    const games = await ctx.db.bingoGame.findMany({
      select: {
        id: true,
        title: true,
        userBingoGames: {
          select: {
            id: true,
          }
        }
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
        }
      }
    });
    return games.map(x => ({...x, userCount: x.userBingoGames.length}));
  }),

  countGames: publicProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.bingoGame.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 12)
        }
      }
    });
    return count;
  }),

  getGameSquares: protectedProcedure.input(z.object({id: z.number()})).query(async ({ ctx, input }) => {
    
    const userGame = await ctx.db.userBingoGame.findFirst({
      where: { bingoGameId: input.id, userId: ctx.session.user.id },
      select: {
        squares: {
          select: {
            bingoSquare: {
              select: {
                content: true,
                isActive: true
              }
            },
            id: true,
          },
          orderBy: {
            id: "asc"
          }
        },
        hasBingo: true,
      }
    });
    if (!userGame) {
      throw new Error("User not in game");
    }

    // Get the indexes of the squares that are in a bingo
    const indexOfBingos: number[] = [];
    if (userGame.hasBingo) {
      const squaresInBingo = getBingoSquares(userGame.squares.map(x => x.bingoSquare.isActive))
      indexOfBingos.push(...squaresInBingo);
    }

    return {
      hasBingo: userGame.hasBingo,
      squares: userGame.squares.map((x, index) => {
        return {
          isActive: x.bingoSquare.isActive,
          content: x.bingoSquare.content,
          inBingo: indexOfBingos.includes(index)
        }
      })
    };
  }),

  getGameSquaresGuest: publicProcedure.input(
    z.object({
      id: z.number(),
      name: z.string().max(100).min(1),
  })).query(async ({ ctx, input }) => {
    
    const userGame = await ctx.db.userBingoGame.findFirst({
      where: { bingoGameId: input.id, userName: input.name },
      select: {
        squares: {
          select: {
            bingoSquare: {
              select: {
                content: true,
                isActive: true
              }
            },
            id: true,
          },
          orderBy: {
            id: "asc"
          }
        },
        hasBingo: true,
      }
    });
    if (!userGame) {
      throw new Error("User not in game");
    }

    // Get the indexes of the squares that are in a bingo
    const indexOfBingos: number[] = [];
    if (userGame.hasBingo) {
      const squaresInBingo = getBingoSquares(userGame.squares.map(x => x.bingoSquare.isActive))
      indexOfBingos.push(...squaresInBingo);
    }

    return {
      hasBingo: userGame.hasBingo,
      squares: userGame.squares.map((x, index) => {
        return {
          isActive: x.bingoSquare.isActive,
          content: x.bingoSquare.content,
          inBingo: indexOfBingos.includes(index)
        }
      })
    };
  }),

});

async function generateNewSquares(db: PrismaClient,userId: string, gameId: number): Promise<number[]> {
  const hash = `${userId}-${gameId}`;
    const squareIds = (await db.bingoSquare.findMany({
      select: {
        id: true,
      }
    })).map(x => x.id);
    const randomSquares: number[] = [];
    const seeded = gen.create(hash);
    // populate the set with 25 random squares using the hash to make the random selection deterministic
    while (randomSquares.length < 25) {
      const randomIndex = seeded.intBetween(0, squareIds.length - 1);
      const randomSquareId = squareIds[randomIndex];
      if (!randomSquares.includes(randomSquareId!)) {
        randomSquares.push(randomSquareId!);
      }
    }
    return randomSquares;
}

