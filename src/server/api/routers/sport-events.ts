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
});
