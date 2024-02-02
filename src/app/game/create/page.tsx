import { getServerAuthSession } from "~/server/auth";
import CreateGameForm from "./create-game-form";
import Header from "~/app/header";
import { getGames } from "~/lib/nhl-api/get-games";
import dayjs from "dayjs";
import { api } from "~/trpc/server";

export default async function Page() {
  const session = await getServerAuthSession();
  const gameInfos = await getGames(dayjs());
  const categories = await api.baseSquares.listCategories.query();

  if (!session?.user) return null;

  return (
    <main className="">
      <Header />
      <div className="space-y-6 gap-4 m-4 flex flex-col min-w-1/2 items-center">
        <div className="flex flex-row gap-4 place-items-center w-12 min-w-12">
          <CreateGameForm games={gameInfos} categories={categories}/>
        </div>
      </div>
    </main>
  )
}
