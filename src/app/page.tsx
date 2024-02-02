import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import { getServerAuthSession } from "~/server/auth";
import { api } from "~/trpc/server";
import Header from "./header";
import JoinButton from "./join-button";

export default async function Home() {
  noStore();
  const session = await getServerAuthSession();
  return (
    <main className="">
      <Header />
      <div className="flex flex-col items-center justify-center mt-4 space-y-4">
        <GameCounter />
        { session ? <ListGames /> : null }
      </div>
    </main>
  );
}

async function GameCounter() {
  const session = await getServerAuthSession();
  const gameCount = await api.game.countGames.query();

  return (
    <div className="flex flex-col items-center">
      <span>{gameCount} active game{gameCount !== 1 ? 's' : ''}. {session ? null : "Sign in to play!"}</span>
      {gameCount === 0 ? <span>Please ask the admin to create a game.</span> : null}
    </div>
  )
}

async function ListGames() {
  const session = await getServerAuthSession();
  const games = await api.game.listGames.query();
  const joinedGames = games.filter(game => game.owner.id !== session?.user.id &&
                                           game.players.some(player => 
                                            player.user.id === session?.user.id
                                          ));
  const ownedGames = games.filter(game => game.owner.id === session?.user.id);
  const joinable = games.filter(game => !joinedGames.some(joinedGame => joinedGame.id === game.id) &&
                                       !ownedGames.some(ownedGame => ownedGame.id === game.id));

  return (
    <>
    {
      joinable.length > 0 ? (
        <div className="flex flex-col items-center justify-center mt-4 space-y-2">
          <span>Joinable games</span>
          <div>
            {
              joinable.map(game => {
                return (
                  <div key={game.id}
                    className="space-x-2 container border rounded-sm p-2 bg-card">
                    <span>{game.name}</span>
                    <JoinButton gameId={game.id} />
                  </div>
                );
              })
            }
          </div>
        </div>
      ): null
    }
    {
      joinedGames.length > 0 ? (
        <div className="flex flex-col items-center justify-center mt-4 space-y-2">
          <h2>Joined Games</h2>
          <div className="space-y-2">
            {
              joinedGames.map(game => {
                return (
                  <Link 
                    key={game.id}
                    href={`/game/${game.id}`}
                    className="flex flex-row items-center justify-between rounded-lg border p-4 gap-4">
                    {game.name}
                  </Link>
                );
              })
            }
          </div>
        </div>
      ) : null
    }
    {
      ownedGames.length > 0 ? (
        <div className="flex flex-col items-center justify-center mt-4 space-y-2">
          <h2>My Games</h2>
          <div className="space-y-2">
            {
              ownedGames.map(game => {
                return (
                  <Link 
                    key={game.id}
                    href={`/game/${game.id}`}
                    className="flex flex-row items-center justify-between rounded-lg border p-4 gap-4">
                    {game.name}
                  </Link>
                );
              })
            }
          </div>
        </div>
      ) : null
    }
    
    </>
  )
}