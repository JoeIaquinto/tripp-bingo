"use client"

import { api } from "~/trpc/react";

export function PlayerOverview({id}: {id: number}) {
  const {data, isFetching, error} = api.game.getGameInfo.useQuery({ id }, {
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

  const usersBySquares = data.usersInGame.sort((a, b) => b.squaresActive - a.squaresActive);
  return (
    <div className="px-2">
      <div className="container rounded-sm border space-y-2">
        <h2 className="text-primary text-lg">{data.usersInGame.length} Player{data.usersInGame.length > 1 ? 's' : ''}</h2>
        <div className="space-y-2 pb-2">
          {usersBySquares.map(user => {
            return (
              <div className="flex-row justify-items-start px-2 py-1 rounded-sm bg-primary/10 space-x-2"
                key={user.name}
              >
                {user.hasBingo ? <span className="text-accent-foreground">🎉 Bingo! - </span> : null}
                <span>{user.name}</span>
                <span>({user.squaresActive} square{user.squaresActive !== 1 ? 's' : ''} active)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
