import { getServerAuthSession } from "~/server/auth";
import { DataTable } from "../../_components/ui/data-table";
import { db } from "~/server/db";
import CreateGameForm from "./create-game-form";
import Header from "~/app/header";
import { columns } from "./game-columns";
import DeleteGameForm from "./delete-game-form";
import { getGames } from "~/lib/nhl-api/get-games";

export default async function Admin() {
  const session = await getServerAuthSession();
  const games = await db.bingoGame.findMany({});
  const gameInfos = await getGames();

  if (!session?.user) return null;
  if (session?.user?.role !== "admin") return null;

  return (
    <main className="">
      <Header />
      <div className="space-y-6 gap-4 m-4">
        <div className="flex flex-row gap-4 items-baseline ml-4">
          <CreateGameForm games={gameInfos} />
          <DeleteGameForm />
        </div>
        <DataTable data={games} columns={columns} colToFilter="title" />
      </div>
    </main>
  )
}
