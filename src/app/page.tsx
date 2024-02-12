import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import { getServerAuthSession } from "~/server/auth";
import { api } from "~/trpc/server";
import Header from "./header";
import JoinButton from "./join-button";
import JoinButtonGuest from "./join-button-guest";

export default async function Home() {
  noStore();
  const session = await getServerAuthSession();
  const signedIn = session !== null;
  return (
    <main className="">
      <Header />
      <div className="flex flex-col items-center justify-center mt-4 space-y-4">
        <GameCounter signedIn={signedIn} />
        <ListGames signedIn={signedIn} />
      </div>
    </main>
  );
}

async function GameCounter({signedIn}: {signedIn: boolean}) {
  const gameCount = await api.game.countGames.query();

  return (
    <div className="flex flex-col items-center">
      <span>{gameCount} active game{gameCount !== 1 ? 's' : ''}. {signedIn ? null : "Sign in to play or join as a guest!"}</span>
      {gameCount === 0 ? <span>Please ask the admin to create a game.</span> : null}
    </div>
  )
}

async function ListGames({signedIn}: {signedIn: boolean}) {
  const games = await api.game.listGames.query();
  const myGames = signedIn ? await api.userBingo.listUserGames.query() : [];
  const joinable = games.filter(game => !myGames.some(myGame => myGame.bingoGameId === game.id));

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
                    <span>{game.title}</span>
                    {
                      signedIn ? <JoinButton gameId={game.id} /> : <JoinButtonGuest gameId={game.id} />
                    }
                  </div>
                );
              })
            }
          </div>
        </div>
      ): null
    }
    {
      myGames.length > 0 ? (
        <div className="flex flex-col items-center justify-center mt-4 space-y-2">
          <h2>My Games</h2>
          <div className="space-y-2">
            {
              myGames.map(game => {
                return (
                  <Link 
                    key={game.bingoGameId}
                    href={`/game/${game.bingoGameId}`}
                    className="flex flex-row items-center justify-between rounded-lg border p-4 gap-4">
                    {game.bingoGame.title}
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