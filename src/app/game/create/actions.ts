'use server'

import { redirect } from "next/navigation";
import { api } from "~/trpc/server";

export async function createGame(props: {
  name: string,
  description?: string | undefined,
  categories: string[],
  sportEvents: string[],
  password?: string | undefined
}) {
  'use server'
  const sportEvents = await Promise.all(props.sportEvents.map(async (id) => {
    return await api.sports.createSportEvents.mutate({
      apiIdentifier: id
    });
  }))
  const game = await api.game.createGame.mutate({
    ...props,
    sportEvents: sportEvents.map(x => x.id)
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