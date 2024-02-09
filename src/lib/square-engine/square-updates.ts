import { type PlayByPlayResponse, getPlayByPlay } from "../nhl-api/get-scoreboard";
import { type HockeySquareData, type SkaterType, type HockeyStat } from "./square-interpreter";
import { db } from "~/server/db";

interface BatchedGameRequests {
  nhlGameId: string;
  pbp: PlayByPlayResponse;
};

export async function updateBingosForPlayers(updatedPlayers: { playerId: string; gameId: number; }[]) {
  return await Promise.allSettled(updatedPlayers.map(async (update) => {
    return await updateBingoForPlayer(update.playerId, update.gameId);
  }));
}

async function updateBingoForPlayer(playerId: string, gameId: number) {
  const player = await db.player.findFirst({
    where: {
      userId: playerId,
      gameId: gameId
    },
    select: {
      bingoId: true,
      squares: {
        select: {
          squareIndex: true,
          square: {
            select: {
              hasOccured: true
            }
          },
          categoryId: true,
        }
      },
      game: {
        select: {
          categories: {
            select: {
              categoryIndex: true,
              id: true,
            }
          },
          bingoPatterns: {
            select: {
              lines: {
                select: {
                  indexPattern: true
                }
              },
              id: true
            }
          }
        }
      },

    }
  });
  if (!player) {
    throw new Error("Player not found");
  }

  const currentBoard = player.game.categories.sort(x => x.categoryIndex)
    .map(x => {
      return player.squares.filter(y => y.categoryId === x.id).sort(y => y.squareIndex).map(y => {
        return y.square.hasOccured;
      });
    });

    // category === x index, square === y index
  const bingoPatterns = player.game.bingoPatterns.map(x => {
    return {
      id: x.id,
      lines: x.lines.map(y => {
        return {
          indexPattern: JSON.parse(y.indexPattern) as { x: number, y: number }[]
        }
      })
    }
  });

  const bingoFound = bingoPatterns.find(pattern => {
    return pattern.lines.some(line => {
      return line.indexPattern.every(index => {
        return currentBoard[index.x]![index.y];
      });
    });
  });
  if (bingoFound) {
    return await db.player.update({
      where: {
        userId_gameId: {
          gameId: gameId,
          userId: playerId
        }
      },
      data: {
        bingoId: bingoFound.id
      }
    });
  }
}

export async function updateSquaresAndEvent(updatedSquares: { squares: HockeySquareData[]; eventId: string; lastEvaluatedEvent: { period: number; timeInPeriod: string; }; }[]) {
 
  const updatedPlayers = await Promise.allSettled(updatedSquares.map(async (squareUpdate) => {
    const playersUpdated = await updateSquares(squareUpdate.squares);
    return playersUpdated;
  }));

  return updatedPlayers.filter(x => x.status === 'fulfilled').flatMap(x => {
    const fulfilledResult = x as PromiseFulfilledResult<{
      playerId: string;
      gameId: number;
    }[]>;
    return fulfilledResult.value;
  });
}

async function updateSquares(input: HockeySquareData[]) {
  const updates = await Promise.allSettled(input.map(async square => {
    return await db.sportEventSquare.update({
      where: { id: square.squareId! },
      data: {
        currentValue: square.currentValue,
        hasOccured: square.currentValue >= square.value,
      },
      select: {
        playersWithSquare: {
          select: {
            playerId: true,
            gameId: true,
          }
        }
      }
    });
  }));
  const filteredUpdates = updates.filter(x => x.status === 'fulfilled').flatMap(x => {
    const fulfilledResult = x as PromiseFulfilledResult<{
      playersWithSquare: {
        gameId: number;
        playerId: string;
      }[]; 
    }>;
    return fulfilledResult.value.playersWithSquare;
  });

  return Array.from(new Set(filteredUpdates.map(update => `${update.gameId}-${update.playerId}`)))
    .map(key => {
      const [gameId, playerId] = key.split('-');
      return filteredUpdates.find(update => update.gameId === Number(gameId) && update.playerId === playerId)!;
    });
}

export async function getEventsToEvaluate() {
  const sportEvents = await fetchSportEventsFromDb();
  console.log('Got sport events', sportEvents.length);
  async function fetchNhlRequests(nhlGameId: string) {
    return {
      nhlGameId,
      pbp: await getPlayByPlay(nhlGameId),
    };
  }

  const uniqueNhlGameIds = [...new Set(sportEvents.map(x => x.apiIdentifier))];
  const sportEventRequests = uniqueNhlGameIds.map(x => fetchNhlRequests(x));
  const apiResponses = await Promise.allSettled(sportEventRequests);
  const successResponses = apiResponses.filter(x => x.status === 'fulfilled').map(x => (x as PromiseFulfilledResult<BatchedGameRequests>).value);

  const eventsWithResponses = sportEvents.map(event => {
    const gotResponse = successResponses.find(x => x.nhlGameId === event.apiIdentifier);
    return {
      eventId: event.id,
      pbp: gotResponse?.pbp,
    }
  });

  const eventsWithPbp = eventsWithResponses.filter(x => x.pbp);

  return eventsWithPbp
  .map(event => {
    const { pbp, eventId } = event;
    const eventWithSquares = sportEvents.find(x => x.id === eventId);
    const lastEvaluatedEvent = JSON.parse(eventWithSquares!.lastUpdatedData) as { period: number, timeInPeriod: string };
    console.log('Got squares to evaluate', eventWithSquares!.squares.length, eventId, lastEvaluatedEvent);
    return {
      eventId,
      hockeySquareData: eventWithSquares!.squares.map(square => {
        return {
          currentValue: square.currentValue,
          skaterType: square.skaterType as SkaterType,
          stat: square.stat as HockeyStat,
          value: square.value,
          playerId: square.playerId ?? undefined,
          teamId: square.teamId ?? undefined,
          squareId: square.id,
        };
      }),
      pbp,
      lastEvaluatedEvent,
    };
  });
}

export async function fetchSportEventsFromDb() {
  return await db.sportEvent.findMany({
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
}
