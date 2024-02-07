'use server'

import { redirect } from "next/navigation";
import { type Option } from "~/app/_components/ui/multiple-selector";
import { api } from "~/trpc/server";

export async function createGame(props: {
  name: string,
  description?: string | undefined,
  categories: Option[],
  sportEvents: Option[],
  password?: string | undefined
  bingoPatterns?: Option[] | undefined
}) {
  'use server'
  const sportEvents = await Promise.all(props.sportEvents.map(async (id) => {
    return await api.sports.createSportEvents.mutate({
      apiIdentifier: id.value
    });
  }))
  const game = await api.game.createGame.mutate({
    ...props,
    categories: props.categories.map(x => x.value),
    sportEvents: sportEvents.map(x => x.id),
    bingoPatterns: props.bingoPatterns?.map(x => parseInt(x.value))
  });
  await api.game.joinGame.mutate({
    gameId: game.id,
    password: props.password
  });
  redirect(`/game/${game.id}`);
}

export async function deactivateGame(id: number) {
  'use server'
  await api.game.deactivateGame.mutate({
    id
  });
}