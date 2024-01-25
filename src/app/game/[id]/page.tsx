import GetBoard from "~/app/_components/get-board";
import { Separator } from "~/app/_components/ui/separator";
import Header from "~/app/header";
import { getServerAuthSession } from "~/server/auth";
import { PlayerOverview } from "./player-overview";
import { GameOverview } from "./game-overview";

export default async function Page({ params }: { params: {id: string} }) {
  const session = await getServerAuthSession();
  const idNumber = parseInt(params.id);

  if (!session?.user) return null;

  return (
    <main className="">
      <Header />
      <GetBoard id={idNumber} />
      <Separator className="my-2" />
      <GameOverview id={idNumber} />
      <Separator className="my-2" />
      <PlayerOverview id={idNumber} />
    </main>
  );
}


