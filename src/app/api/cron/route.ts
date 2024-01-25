
import { type NextRequest, NextResponse } from 'next/server';
import { type PlayByPlayResponse, getPlayByPlay, getBoxScore, type BoxScoreResponse } from '~/lib/nhl-api/get-scoreboard';

import { db } from '~/server/db';

interface BatchedGameRequests {
  nhlGameId: string;
  pbp: PlayByPlayResponse;
  boxScore: BoxScoreResponse;
};

export async function GET(req : NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.error();
  }

  const games = await db.bingoGame.findMany({
    select: {
      id: true,
      nhlGameId: true,
      userBingoGames: {
        select: {
          id: true,
          userId: true,
          squares: {
            select: {
              id: true,
              bingoSquareId: true,
              bingoSquare: {
                select: {
                  id: true,
                  content: true,
                  isActive: true
                }
              }
            }
          }
        }
      }
    },
    where: {
      createdAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 12)
      },
      nhlGameId: {
        not: undefined
      }
    }
  });

  async function getGameRequests(nhlGameId: string) {
    return {
      nhlGameId,
      pbp: await getPlayByPlay(nhlGameId),
      boxScore: await getBoxScore(nhlGameId)
    };
  }

  const uniqueNhlGameIds = [...new Set(games.map(x => x.nhlGameId))];
  const gameRequests = uniqueNhlGameIds.map(x => getGameRequests(x));
  const gameResponses = await Promise.allSettled(gameRequests);
  const successResponses = gameResponses.filter(x => x.status === 'fulfilled').map(x => (x as PromiseFulfilledResult<BatchedGameRequests>).value);

  const gamesWithResponses = games.map(game => {
    const gotResponse = successResponses.find(x => x.nhlGameId === game.nhlGameId);
    return {
      ...game,
      pbp: gotResponse?.pbp,
      boxScore: gotResponse?.boxScore,
    }
  });

  // TODO: Update squares with new content

  return NextResponse.json({ ok: true });
}