
import { type NextRequest, NextResponse } from 'next/server';
import { type PlayByPlayResponse, getPlayByPlay } from '~/lib/nhl-api/get-scoreboard';

import { api } from "~/trpc/server";
import { type HockeySquareData, type HockeyStat, type SkaterType, evaluate } from '~/lib/square-engine/square-interpreter';

interface BatchedGameRequests {
  nhlGameId: string;
  pbp: PlayByPlayResponse;
};

export async function GET(req : NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.error();
  }

  const games = await api.sports.getSquaresForInterpretation.query();

  async function getGameRequests(nhlGameId: string) {
    return {
      nhlGameId,
      pbp: await getPlayByPlay(nhlGameId),
    };
  }

  const uniqueNhlGameIds = [...new Set(games.map(x => x.apiIdentifier))];
  const gameRequests = uniqueNhlGameIds.map(x => getGameRequests(x));
  const gameResponses = await Promise.allSettled(gameRequests);
  const successResponses = gameResponses.filter(x => x.status === 'fulfilled').map(x => (x as PromiseFulfilledResult<BatchedGameRequests>).value);

  const gamesWithResponses = games.map(square => {
    const gotResponse = successResponses.find(x => x.nhlGameId === square.apiIdentifier);
    return {
      gameId: square.id,
      pbp: gotResponse?.pbp,
    }
  });

  const gamesWithPbp = gamesWithResponses.filter(x => x.pbp);


  const updatedSquares = gamesWithPbp
  .map(game => {
      const { pbp, gameId } = game;
      const gameWithSquares = games.find(x => x.id === gameId);
      const lastEvaluatedEvent = JSON.parse(gameWithSquares!.lastUpdatedData) as { period: number, timeInPeriod: string };
      
      const hockeySquareData: HockeySquareData[] = gameWithSquares!.squares.map(square => {
        return {
          currentValue: square.currentValue,
          skaterType: square.skaterType as SkaterType,
          stat: square.stat as HockeyStat,
          value: square.value,
          playerId: square.playerId ?? undefined,
          teamId: square.teamId ?? undefined,
          squareId: square.id,
        }
      });
      return {
        gameId,
        hockeySquareData,
        pbp,
        lastEvaluatedEvent,
      };
     }).map(({ hockeySquareData, pbp, lastEvaluatedEvent, gameId }) => {

      const updatedSquares = evaluate(hockeySquareData, pbp!, lastEvaluatedEvent);
      return {
        updatedSquares,
        gameId,
      };
  });
  
  await Promise.allSettled(updatedSquares.map(async squares => {
    await api.sports.updateSquares.mutate({
      gameId: squares.gameId,
      squares: squares.updatedSquares.squares.map(square => {
        return {
          id: square.squareId!,
          currentValue: square.currentValue,
          hasOccured: square.currentValue >= square.value,
        }
      })
    })
    await api.sports.updateSportEvent.mutate({
      id: squares.gameId,
      lastEvaluatedEvent: squares.updatedSquares.lastEvaluatedEvent,
    });
  }));

  // TODO: Update bingo state for all updated squares
  // TODO: Invalidate RSC for all updated games

  return NextResponse.json({ ok: true });
}