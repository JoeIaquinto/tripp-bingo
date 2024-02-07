'use server'

import { api } from "~/trpc/server";

export async function deactivateGame(id: number) {
  'use server'
  await api.game.deactivateGame.mutate({
    id
  });
}