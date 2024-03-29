'use server'

import { revalidatePath } from "next/cache";
import { db } from "~/server/db";

export async function createGame(title: string) {
  'use server'
  await db.bingoGame.create({
    data: {
      title
    }
  });
  revalidatePath('/admin/games');
}

export async function deleteGame(id: number) {
  'use server'
  await db.bingoGame.delete({
    where: {
      id
    }
  });
  revalidatePath('/admin/games');
}