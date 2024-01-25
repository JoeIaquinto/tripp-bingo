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
import { getBoxScore, getPlayByPlay } from "~/lib/nhl-api/get-scoreboard";

export const gameRouter = createTRPCRouter({
  createGame: adminProcedure.input(z.object({
    title: z.string().max(100).min(1),
    nhlGameId: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const game = await ctx.db.bingoGame.create({
      data: input,
    });
    return game;
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
        squares: {
          createMany: {
            data: randomSquareIds.map(x => ({ bingoSquareId: x })),
          }
        },
      },
    });

    return userGame;
  }),

  getGameInfo: protectedProcedure.input(z.object({
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
        user: {
          select: {
            name: true,
          }
        },
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
        name: x.user.name,
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

  listGames: protectedProcedure.query(async ({ ctx }) => {
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
          gte: new Date(Date.now() - 1000 * 60 * 60 * 12)
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

  getBoxScore: protectedProcedure.input(z.object({id: z.number()})).query(async ({ ctx, input }) => {
    const game = await ctx.db.bingoGame.findFirst({ where: { id: input.id } });
    if (!game) {
      throw new Error("Game not found");
    }
    const boxScore = await getBoxScore(game.nhlGameId);
    if (!boxScore) {
      throw new Error("Box score not found");
    }
    return boxScore;
  }),

  getPlayByPlay: protectedProcedure.input(z.object({id: z.number()})).query(async ({ ctx, input }) => {
    const game = await ctx.db.bingoGame.findFirst({ where: { id: input.id } });
    if (!game) {
      throw new Error("Game not found");
    }
    const playByPlay = await getPlayByPlay(game.nhlGameId);
    if (!playByPlay) {
      throw new Error("Play By Play not found");
    }
    return playByPlay;
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

