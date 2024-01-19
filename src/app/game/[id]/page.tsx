import GetBoard from "~/app/_components/get-board";
import { Separator } from "~/app/_components/ui/separator";
import Header from "~/app/header";
import { getServerAuthSession } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function Page({ params }: { params: {id: string} }) {
  const session = await getServerAuthSession();
  const idNumber = parseInt(params.id);

  const game = await api.game.getGameInfo.query({ id: idNumber });

  if (!session?.user) return null;

  return (
    <main className="">
      <Header />
      <GetBoard id={idNumber} />
      <Separator className="my-2" />
      <PlayerOverview users={game.usersInGame} />
    </main>
  );
}

function PlayerOverview({ users } : { users: { name: string | null; hasBingo: boolean; squaresActive: number; }[]}) {
  const usersBySquares = users.sort((a, b) => b.squaresActive - a.squaresActive);
  return (
    <div className="px-2">
      <div className="container rounded-sm border space-y-2">
        <h2 className="text-primary text-lg">{users.length} Player{users.length > 1 ? 's' : ''}</h2>
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
  )
}
