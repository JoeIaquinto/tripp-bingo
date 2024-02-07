import { getServerAuthSession } from "~/server/auth";
import CreateGameForm from "./create-game-form";
import Header from "~/app/header";
import { getGames } from "~/lib/nhl-api/get-games";
import dayjs from "dayjs";
import { api } from "~/trpc/server";

export default async function Page() {
  const session = await getServerAuthSession();
  const gameInfos = await getGames(dayjs(new Date()));
  const categories = await api.baseSquares.listCategories.query();
  const bingoPatterns = (await api.bingoPatterns.listPatterns.query()).map(x => {
    return {
      value: x.id.toString(),
      label: `${x.name} - ${x.description} - ${x._count.lines} line(s)`
    }
  });

  if (!session?.user) return null;

  return (
    <main className="">
      <Header />
      <CreateGameForm games={gameInfos} categories={categories} bingoPatterns={bingoPatterns}/>
    </main>
  )
}
