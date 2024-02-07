"use client"

import { api } from "~/trpc/react";

export function PlayerOverview({id}: {id: number}) {
  const {data, isFetching, error} = api.game.getPlayers.useQuery({
    gameId: id,
  }, {
    refetchInterval: 30000,
    initialData: undefined,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (isFetching && !data) {
    return <div>Loading...</div>
  }
  if (error) {
    return <div>Error: {error.message}</div>
  }
  if (!data) {
    return <div>No data</div>
  }

  return (
    <div className="px-2">
      <div className="container rounded-sm border space-y-2">
        <h2 className="text-primary text-lg">{data.length} Player{data.length > 1 ? 's' : ''}</h2>
        <div className="space-y-2 pb-2">
          {data.map(player => {
            return (
              <div className="flex-row justify-items-start px-2 py-1 rounded-sm bg-primary/10 space-x-2"
                key={player.user.id}
              >
                {player.bingoId ? <span className="text-accent-foreground">🎉 Bingo! - </span> : null}
                <span>{player.user.name}</span>
                <span>({player.squares.length}/25 squares hit)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
