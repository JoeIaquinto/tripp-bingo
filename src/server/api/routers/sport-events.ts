import dayjs from "dayjs";
import { z } from "zod";
import { getGames } from "~/lib/nhl-api/get-games";
import { getLanding } from "~/lib/nhl-api/get-landing";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const sportEventRouter = createTRPCRouter({
  createSportEvents: protectedProcedure.input(z.object({
    apiIdentifier: z.string().min(1),
  })).mutation(async ({ ctx, input }) => {

    let sportEvent = await ctx.db.sportEvent.findFirst({
      where: {
        AND: {
          apiIdentifier: input.apiIdentifier,
          gameType: "hockey"
        }
      }
    });

    if (sportEvent) {
      return sportEvent;
    }

    const gameInfo = await getLanding(input.apiIdentifier);

    sportEvent = await ctx.db.sportEvent.create({
      data: {
        apiIdentifier: input.apiIdentifier,
        gameType: "hockey",
        awayTeam: gameInfo.awayTeam.name.default,
        homeTeam: gameInfo.homeTeam.name.default,
        startTime: dayjs(gameInfo.startTimeUTC).toDate(),
        lastUpdatedData: JSON.stringify({period:1, timeInPeriod:'20:00'})
      }
    });

    return sportEvent;
  }),

  getPossibleSportEvents: protectedProcedure.input(z.object({
    gameType: z.enum(["hockey"]),
    date: z.string().datetime().optional(),
  }))
  .query(async ({ input }) => {
    const day = input.date ? dayjs(input.date) : dayjs();
    const games = await getGames(day);
    return games;
  }),

  getSportEvents: protectedProcedure.input(z.object({
    gameType: z.enum(["hockey"]),
    date: z.string().datetime().optional(),
  }))
  .query(async ({ ctx, input }) => {
    const day = input.date ? dayjs(input.date) : dayjs();
    const sportEvents = await ctx.db.sportEvent.findMany({
      where: {
        AND: {
          gameType: input.gameType,
          startTime: {
            gte: day.subtract(4, 'hours').toDate(),
            lt: day.add(1, 'day').toDate()
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    return sportEvents;
  }),

  getSquaresForInterpretation: protectedProcedure.query(async ({ ctx }) => {
    const games = await ctx.db.sportEvent.findMany({
      select: {
        id: true,
        apiIdentifier: true,
        lastUpdatedData: true,
        squares: {
          select: {
            _count: true,
            id: true,
            hasOccured: true,
            value: true,
            currentValue: true,
            playerId: true,
            teamId: true,
            stat: true,
            skaterType: true,
            playersWithSquare: {
              select: {
                playerId: true,
                gameId: true,
                squareIndex: true,
              }
            }
          },
          where: {
            hasOccured: false
          }
        }
      },
      where: {
        startTime: {
          gte: new Date(Date.now() - 1000 * 60 * 60 * 12)
        },
        apiIdentifier: {
          not: undefined
        }
      }
    });
    return games
  }),

  updateSportEvent: protectedProcedure.input(z.object({
    id: z.string().cuid(),
    lastEvaluatedEvent: z.object({ period: z.number(), timeInPeriod: z.string() }),
  })).mutation(async ({ ctx, input }) => {
    const sportEvent = await ctx.db.sportEvent.findFirst({ where: { id: input.id } });
    if (!sportEvent) {
      throw new Error("Sport event not found");
    }
    await ctx.db.sportEvent.update({
      where: { id: input.id },
      data: {
        lastUpdatedData: JSON.stringify(input.lastEvaluatedEvent)
      }
    });
  }),

  updateSquares: protectedProcedure.input(z.object({
    squares: z.array(z.object({
      id: z.string().cuid(),
      currentValue: z.number(),
      hasOccured: z.boolean(),
    })),
    gameId: z.string().cuid(),
  })).mutation(async ({ ctx, input }) => {
    const sportEvent = await ctx.db.sportEvent.findFirst({ where: { id: input.gameId } });
    if (!sportEvent) {
      throw new Error("Sport event not found");
    }

    // update all squares
    await Promise.allSettled(input.squares.map(async square => {
      await ctx.db.sportEventSquare.update({
        where: { id: square.id },
        data: {
          currentValue: square.currentValue,
          hasOccured: square.hasOccured
        }
      });
    }));
    
  }),
});
