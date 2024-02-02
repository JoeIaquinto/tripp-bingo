import { z } from "zod";
import { getLanding, type TeamLandingInfo, type PlayerLandingStats } from "~/lib/nhl-api/get-landing";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { getRandomElement, getRandomSeed } from "~/lib/rand";
import { type BaseHockeySquareData, generate, type HockeySquareData } from "~/lib/square-engine/square-interpreter";
import { customAlphabet } from 'nanoid/non-secure';

export const gameRouter = createTRPCRouter({
  createGame: protectedProcedure.input(z.object({
    name: z.string().max(100).min(1),
    description: z.string().max(100).optional(),
    sportEvents: z.array(z.string().cuid()).min(1),
    categories: z.array(z.string().cuid()).min(5).max(5),
    password: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const rand = getRandomSeed();

    const categories = await ctx.db.baseGameCategory.findMany({
      where: {
        id: {
          in: input.categories
        }
      },
      include: {
        squares: true
      }
    });

    if (categories.length !== 5) {
      throw new Error("Invalid categories");
    }
    const shuffledCategories = categories.sort(() => rand.random() - 0.5);
    const joinCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 4)();
    const game = await ctx.db.game.create({
      data: {
        name: input.name,
        description: input.description,
        ownerId: ctx.session.user.id,
        password: input.password,
        joinCode: joinCode,
        categories: {
          create: shuffledCategories.map((x, index) => {
            return {
              gameType: x.gameType,
              baseCategoryId: x.id,
              categoryIndex: index,
              name: x.name,
              description: x.description,
            }
          })
        },
        sportEvents: {
          connect: input.sportEvents.map(x => ({ id: x }))
        },
      }
    });

    return game;
  }),

  joinGame: protectedProcedure.input(z.object({
    gameId: z.number().int(),
    password: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const rand = getRandomSeed();
    const game = await ctx.db.game.findFirst({ 
      where: { id: input.gameId },
      include: {
        categories: {
          include: {
            baseCategory: {
              include: {
                squares: true
              }
            }
          },
          orderBy: {
            categoryIndex: "asc"
          }
        },
        sportEvents: {
          where: {
            apiIdentifier: {
              not: undefined
            }
          }
        }
      }
    });
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.password && input.password !== game.password) {
        throw new Error("Invalid password");
    }

    const player = await ctx.db.player.findFirst({
      where: {
        userId: ctx.session.user.id,
        gameId: game.id
      }
    });
    if (player) {
      throw new Error("Already in game");
    }

    const playerGame = await ctx.db.player.create({
      data: {
        gameId: game.id,
        userId: ctx.session.user.id,
      }
    });

    const landings = await Promise.all(game.sportEvents.map(async x => {
      return {
        landing: await getLanding(x.apiIdentifier),
        sportEvent: x
      }
    }));
    
    for (const category of game.categories) {
      const baseSquares = category.baseCategory.squares;
      for (let i = 0; i < 5; i++) {
        const baseSquare = getRandomElement(baseSquares, rand);
        const randomGame = getRandomElement(landings, rand);
        const home = rand.random() > 0.5;
        const randomTeam = home ? randomGame.landing.homeTeam : randomGame.landing.awayTeam;
        const players = (home ? 
          randomGame.landing.matchup.skaterSeasonStats.filter(x => x.teamId === randomGame.landing.homeTeam.id) :
          randomGame.landing.matchup.skaterSeasonStats.filter(x => x.teamId === randomGame.landing.awayTeam.id))
          .filter(x => x.position === baseSquare.skaterType || (baseSquare.skaterType === 'F' ? (x.position === 'L' || x.position === 'R' || x.position === 'C') : false));
        const usePlayer = rand.random() > 0.2;
        const randomPlayer = usePlayer ? getRandomElement(players, rand): undefined;

        const squareData = generate(baseSquare as BaseHockeySquareData, randomTeam, randomPlayer, rand);

        const description = formatSquareDescription(baseSquare, randomPlayer, squareData, randomTeam);

        const sportEventSquare = await ctx.db.sportEventSquare.create({
          data: {
            description,
            value: squareData.value,
            categories: {
              connect: {
                id: category.id
              }
            },
            playerId: squareData.playerId,
            teamId: squareData.teamId,
            skaterType: squareData.skaterType,
            stat: squareData.stat,
            sportEventId: randomGame.sportEvent.id,
          }
        });
        await ctx.db.playerSquare.create({
          data: {
            playerId: playerGame.userId,
            gameId: game.id,
            squareId: sportEventSquare.id,
            categoryId: category.id,
            squareIndex: i,
          }
        });
      }
      
    }
  }),

  reRollSquare: protectedProcedure.input(z.object({
    gameId: z.number().int(),
    categoryId: z.string().cuid(),
    squareIndex: z.number().int().positive().max(4),
  })).mutation(async ({ ctx, input }) => {
    const player = await ctx.db.player.findFirst({
      where: {
        userId: ctx.session.user.id,
        gameId: input.gameId
      }
    });
    if (!player) {
      throw new Error("Not in game");
    }
    if (player.rerollsLeft === 0) {
      throw new Error("No rerolls left");
    }
    const updatePlayer = await ctx.db.player.update({
      where: {
        userId_gameId: {
          gameId: input.gameId,
          userId: player.userId
        },
      },
      data: {
        rerollsLeft: player.rerollsLeft - 1
      }
    })

    const square = await ctx.db.playerSquare.findFirst({
      where: {
        gameId: input.gameId,
        categoryId: input.categoryId,
        squareIndex: input.squareIndex,
        playerId: ctx.session.user.id
      },
      include: {
        square: true,
        game: {
          include: {
            sportEvents: true
          }
        },
        category: {
          include: {
            baseCategory: {
              include: {
                squares: true
              }
            }
          }
        }
      }
    });

    if (!square) {
      throw new Error("Square not found");
    }

    const baseSquares = square.category.baseCategory.squares;
    const landings = await Promise.all(square.game.sportEvents.map(async x => {
      return {
        landing: await getLanding(x.apiIdentifier),
        sportEvent: x
      }
    }));
    const rand = getRandomSeed();

    const baseSquare = getRandomElement(baseSquares, rand);
    const randomGame = getRandomElement(landings, rand);
    const home = rand.random() > 0.5;
    const randomTeam = home ? randomGame.landing.homeTeam : randomGame.landing.awayTeam;
    const players = (home ? 
      randomGame.landing.matchup.skaterSeasonStats.filter(x => x.teamId === randomGame.landing.homeTeam.id) :
      randomGame.landing.matchup.skaterSeasonStats.filter(x => x.teamId === randomGame.landing.awayTeam.id))
      .filter(x => x.position === baseSquare.skaterType || (baseSquare.skaterType === 'F' ? (x.position === 'L' || x.position === 'R' || x.position === 'C') : false));
    const usePlayer = rand.random() > 0.2;
    const randomPlayer = usePlayer ? getRandomElement(players, rand): undefined;

    const squareData = generate(baseSquare as BaseHockeySquareData, randomTeam, randomPlayer, rand);

    const description = formatSquareDescription(baseSquare, randomPlayer, squareData, randomTeam);

    const sportEventSquare = await ctx.db.sportEventSquare.create({
      data: {
        description,
        value: squareData.value,
        categories: {
          connect: {
            id: square.categoryId
          }
        },
        playerId: squareData.playerId,
        teamId: squareData.teamId,
        skaterType: squareData.skaterType,
        stat: squareData.stat,
        sportEventId: randomGame.sportEvent.id,
      }
    });
    const newSquare = await ctx.db.playerSquare.update({
      where: {
        playerId_gameId_categoryId_squareIndex: {
          categoryId: input.categoryId,
          gameId: input.gameId,
          playerId: ctx.session.user.id,
          squareIndex: input.squareIndex
        }  
      },
      data: {
        squareId: sportEventSquare.id,
      }
    });

    return {
      newSquare,
      rerollsLeft: updatePlayer.rerollsLeft
    };
  }),

  listGames: protectedProcedure.query(async ({ ctx }) => {
    const games = await ctx.db.game.findMany({
      where: {
        createdAt: {
          gte: new Date(new Date().getTime() - 60 * 60 * 1000 * 6)
        },
        active: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        password: true,
        active: true,
        _count: true,
        owner: {
          select: {
            name: true,
            id: true,
          }
        },
        sportEvents: {
          select: {
            startTime: true,
            gameType: true,
            awayTeam: true,
            homeTeam: true,
            apiIdentifier: true,
          }
        },
        players: {
          select: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return games.map(x => {
      return {
        ...x,
        password: x.password ? true : false,
        sportEvents: x.sportEvents.map(y => {
          return {
            ...y,
            startTime: y.startTime.toISOString()
          }
        })
      }
    });
  }),

  listAllGames: adminProcedure.query(async ({ ctx }) => {
    const games = await ctx.db.game.findMany({
      take: 100,
      where: {
        createdAt: {
          gte: new Date(new Date().getTime() - 60 * 60 * 1000 * 24 * 7)
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        password: true,
        active: true,
        _count: true,
        owner: {
          select: {
            name: true,
            id: true,
          }
        },
        sportEvents: {
          select: {
            startTime: true,
            gameType: true,
            awayTeam: true,
            homeTeam: true,
          }
        },
      }
    });

    return games.map(x => {
      return {
        ...x,
        password: x.password ? true : false,
        sportEvents: x.sportEvents.map(y => {
          return `${y.gameType} ${y.awayTeam}@${y.homeTeam} ${y.startTime.toISOString()}`
        }).join(", "),

      }
    });
  }),

  updateExpiredGames: protectedProcedure.mutation(async ({ ctx }) => {
    const games = await ctx.db.game.updateMany({
      where: {
        createdAt: {
          lte: new Date(new Date().getTime() - 60 * 60 * 1000 * 6),
          gte: new Date(new Date().getTime() - 60 * 60 * 1000 * 12)
        },
        active: true,
      },
      data: {
        active: false,
        joinCode: undefined
      }
    });
    return games;
  }),

  countGames: publicProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.game.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getTime() - 60 * 60 * 1000 * 6)
        },
        active: true,
        password: null
      }
    });
    return count;
  }),

  deleteGame: adminProcedure.input(z.object({ id: z.number().int() }))
  .mutation(async ({ ctx, input }) => {
    const game = await ctx.db.game.findFirst({ where: { id: input.id } });
    if (!game) {
      throw new Error("Game not found");
    }
    await ctx.db.game.delete({ where: { id: game.id } });
  }),

  deactivateGame: protectedProcedure.input(z.object({ id: z.number().int() }))
  .mutation(async ({ ctx, input }) => {
    const game = await ctx.db.game.findFirst({ where: { id: input.id, ownerId: ctx.session.user.id } });
    if (!game) {
      throw new Error("Game not found");
    }
    await ctx.db.game.update({
      where: { id: game.id },
      data: {
        active: false
      }
    });
  }),

  getGame: protectedProcedure.input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
    const game = await ctx.db.game.findFirst({ 
      where: { id: input.id },
      include: {
        categories: {
          select: {
            categoryIndex: true,
            description: true,
            name: true,
            gameType: true,
            id: true,
          },
          orderBy: {
            categoryIndex: "asc"
          }
        },
        sportEvents: {
          where: {
            apiIdentifier: {
              not: undefined
            }
          }
        }
      }
    });
    if (!game) {
      throw new Error("Game not found");
    }

    const myBoard = await ctx.db.player.findMany({
      where: {
        gameId: game.id,
        userId: ctx.session.user.id
      },
      select: {
        // TODO: Add bingo,
        rerollsLeft: true,
        squares: {
          select: {
            square: {
              select: {
                description: true,
                value: true,
                playerId: true,
                teamId: true,
                skaterType: true,
                stat: true,
                currentValue: true,
                hasOccured: true,
                id: true,
              }
            },
            squareId: true,
            categoryId: true,
            squareIndex: true,
          }
        },
        bingoId: true,
      }
    });
    
    const otherPlayers = await ctx.db.player.findMany({
      where: {
        gameId: game.id,
        userId: {
          not: ctx.session.user.id
        }
      },
      select: {
        user: {
          select: {
            name: true,
            id: true
          }
        },
        bingoId: true,
        _count: true,
        squares: {
          where: {
            square: {
              hasOccured: true
            }
          },
          select: {
            square: {
              select: {
                _count: true
              }
            },
          }
        }
      }
    });

    return {
      game,
      myBoard,
      otherPlayers
    }
  }),
});

function formatSquareDescription(baseSquare: { id: number; baseGameCategoryId: string; description: string; skaterType: string; stat: string; rangeMin: number; rangeMax: number; displayFormat: string; }, randomPlayer: PlayerLandingStats | undefined, squareData: HockeySquareData, randomTeam: TeamLandingInfo) {
  let description = baseSquare.displayFormat;
  if (randomPlayer && squareData.teamId) {
    description = description.replace("{player}", randomPlayer.name.default);
  }
  if (squareData.teamId) {
    description = description.replace("{team}", randomTeam.name.default);
  }
  description = description.replace("{stat}", squareData.stat);
  description = description.replace("{value}", squareData.value.toString());
  return description;
}

