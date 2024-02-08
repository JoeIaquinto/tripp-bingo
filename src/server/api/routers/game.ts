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
    bingoPatterns: z.array(z.number().int()).min(1).optional(),
    password: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const rand = getRandomSeed();

    const bingoPatterns = input.bingoPatterns ?? [(await ctx.db.bingoPattern.findFirst({
      where: {
        name: "Classic"
      },
      select: {
        id: true
      }
    }))!.id];

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
        bingoPatterns: {
          connect: bingoPatterns.map(x => ({ id: x }))
        },
        sportEvents: {
          connect: input.sportEvents.map(x => ({ id: x }))
        },
      }
    });

    return game;
  }),

  gameHasPassword: protectedProcedure.input(z.object({
    gameId: z.number().int() 
  })).query(async ({ ctx, input }) => {
    const game = await ctx.db.game.findFirst({ where: { id: input.gameId } });
    if (!game) {
      throw new Error("Game not found");
    }
    return game.password ? true : false;
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
      const newSquares: HockeySquareData[] = [];
      while (newSquares.length < 5) {
        const baseSquare = getRandomElement(baseSquares, rand);
        const randomGame = getRandomElement(landings, rand);
        const homeTeam = randomGame.landing.homeTeam;
        const awayTeam = randomGame.landing.awayTeam;
        const homeTeamSelected = rand.random() > 0.5;
        const selectedTeam = homeTeamSelected ? homeTeam : awayTeam;
        const otherTeam = homeTeamSelected ? awayTeam : homeTeam;

        let randomPlayer: PlayerLandingStats | undefined;
        if (baseSquare.skaterType === 'F' || baseSquare.skaterType === 'D') {
          const players = randomGame.landing.matchup.skaterSeasonStats.filter(x => x.teamId === selectedTeam.id)
            .filter(x => x.position === baseSquare.skaterType || (baseSquare.skaterType === 'F' ? (x.position === 'L' || x.position === 'R' || x.position === 'C') : false));
          randomPlayer = getRandomElement(players, rand);
        } 

        const squareData = generate(baseSquare as BaseHockeySquareData, selectedTeam, randomPlayer, rand);
        if(!similarExists({ squares: newSquares, square: squareData })) {
          const description = formatSquareDescription(baseSquare, randomPlayer, squareData, selectedTeam, otherTeam, homeTeamSelected);

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
              squareIndex: newSquares.length,
            }
          });
          newSquares.push(squareData);
        }
      }
      
    }
  }),

  reRollSquare: protectedProcedure.input(z.object({
    gameId: z.number().int(),
    categoryId: z.string().cuid(),
    squareIndex: z.number().int().min(0).max(4),
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

    const existingSquares = await ctx.db.playerSquare.findMany({
      where: {
        gameId: input.gameId,
        categoryId: input.categoryId,
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
    
    const existingSquareInfo = existingSquares.map(x => x.square as HockeySquareData);
    const squareToReroll = existingSquares.find(x => x.squareIndex === input.squareIndex);

    if (!squareToReroll) {
      throw new Error("Square not found");
    }

    const baseSquares = squareToReroll.category.baseCategory.squares;
    const landings = await Promise.all(squareToReroll.game.sportEvents.map(async x => {
      return {
        landing: await getLanding(x.apiIdentifier),
        sportEvent: x
      }
    }));
    const rand = getRandomSeed();

    while (true) {
      const baseSquare = getRandomElement(baseSquares, rand);
      const randomGame = getRandomElement(landings, rand);
      const homeTeam = randomGame.landing.homeTeam;
      const awayTeam = randomGame.landing.awayTeam;
      const homeTeamSelected = rand.random() > 0.5;
      const selectedTeam = homeTeamSelected ? homeTeam : awayTeam;
      const otherTeam = homeTeamSelected ? awayTeam : homeTeam;

      let randomPlayer: PlayerLandingStats | undefined;
      if (baseSquare.skaterType === 'F' || baseSquare.skaterType === 'D') {
        const players = randomGame.landing.matchup.skaterSeasonStats.filter(x => x.teamId === selectedTeam.id)
          .filter(x => x.position === baseSquare.skaterType || (baseSquare.skaterType === 'F' ? (x.position === 'L' || x.position === 'R' || x.position === 'C') : false));
        randomPlayer = getRandomElement(players, rand);
      } 
      const squareData = generate(baseSquare as BaseHockeySquareData, selectedTeam, randomPlayer, rand);
      
      if (!similarExists({ squares: existingSquareInfo, square: squareData })) {

        const sportEventSquare = await ctx.db.sportEventSquare.create({
          data: {
            description: formatSquareDescription(baseSquare, randomPlayer, squareData, selectedTeam, otherTeam, homeTeamSelected),
            value: squareData.value,
            categories: {
              connect: {
                id: squareToReroll.categoryId
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
      }
    }
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
        },
        bingoPatterns: {
          select: {
            name: true,
            description: true,
            lines: {
              select: {
                indexPattern: true
              }
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
      game: {
        ...game,
        bingoPatterns: game.bingoPatterns.map(x => {
          return {
            ...x,
            lines: x.lines.map(y => {
              return {
                ...y,
                indexPattern: JSON.parse(y.indexPattern) as { x: number, y: number }[]
              }
            })
          }
        })
      },
      myBoard,
      otherPlayers
    }
  }),

  getPlayers: protectedProcedure.input(z.object({ gameId: z.number().int() }))
  .query(async ({ ctx, input }) => {
    const players = await ctx.db.player.findMany({
      where: {
        gameId: input.gameId
      },
      select: {
        user: {
          select: {
            name: true,
            id: true,
          },
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
                hasOccured: true
              }
            },
          }
        }
      }
    });
    return players;
  }),
});

function formatSquareDescription(baseSquare: { id: number; baseGameCategoryId: string; description: string; skaterType: string; stat: string; rangeMin: number; rangeMax: number; displayFormat: string; }, randomPlayer: PlayerLandingStats | undefined, squareData: HockeySquareData, randomTeam: TeamLandingInfo, otherTeam: TeamLandingInfo, randomTeamHome: boolean) {
  let description = baseSquare.displayFormat;
  if (randomPlayer && squareData.teamId) {
    description = description.replace("{player}", randomPlayer.name.default);
  }
  if (squareData.teamId) {
    description = description.replace("{team}", randomTeam.name.default);
  }
  description = description.replace("{game}", getGameDescriptor(randomTeam, otherTeam, randomTeamHome));
  description = description.replace("{stat}", squareData.stat);
  description = description.replace("{value}", squareData.value.toString());
  return description;
}

const teamNameMap: Record<string, string> = {
  'Colorado Avalanche': 'COL',
  'Chicago Blackhawks': 'CHI',
  'Columbus Blue Jackets': 'CBJ',
  'Dallas Stars': 'DAL',
  'Detroit Red Wings': 'DET',
  'Florida Panthers': 'FLA',
  'Los Angeles Kings': 'LAK',
  'Minnesota Wild': 'MIN',
  'Montreal Canadiens': 'MTL',
  'Nashville Predators': 'NSH',
  'New Jersey Devils': 'NJD',
  'New York Islanders': 'NYI',
  'New York Rangers': 'NYR',
  'Ottawa Senators': 'OTT',
  'Philadelphia Flyers': 'PHI',
  'Pittsburgh Penguins': 'PIT',
  'San Jose Sharks': 'SJS',
  'St. Louis Blues': 'STL',
  'Tampa Bay Lightning': 'TBL',
  'Toronto Maple Leafs': 'TOR',
  'Vancouver Canucks': 'VAN',
  'Vegas Golden Knights': 'VGK',
  'Washington Capitals': 'WSH',
  'Winnipeg Jets': 'WPG',
  'Anaheim Ducks': 'ANA',
  'Arizona Coyotes': 'ARI',
  'Boston Bruins': 'BOS',
  'Buffalo Sabres': 'BUF',
  'Calgary Flames': 'CGY',
  'Carolina Hurricanes': 'CAR',
  'Edmonton Oilers': 'EDM',
  'Seattle Kraken': 'SEA',
};

function getGameDescriptor(team1: TeamLandingInfo, team2: TeamLandingInfo, team1Home: boolean) {
  const team1Abbrev = teamNameMap[team1.name.default]!;
  const team2Abbrev = teamNameMap[team2.name.default]!;
  const awayTeamAbbrev = team1Home ? team2Abbrev : team1Abbrev;
  const homeTeamAbbrev = team1Home ? team1Abbrev : team2Abbrev;
  return `${awayTeamAbbrev}@${homeTeamAbbrev}`;
}

function similarExists({ squares, square }: {
  squares: HockeySquareData[]; square: HockeySquareData;
}): boolean {
      if (square.playerId && squares.some(x => x.playerId === square.playerId)) {
        return true;
      }
      if (!square.playerId && square.teamId && squares.some(x => x.teamId === square.teamId && x.stat === square.stat)) {
        return true;
      }
      return false;
    }