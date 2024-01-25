'use server'

import { revalidatePath } from "next/cache";
import { db } from "~/server/db";
import { api } from "~/trpc/server";

export async function createSquare(square: string) {
  'use server'
  await db.bingoSquare.create({
    data: {
      content: square
    }
  });
  revalidatePath('/admin');
}

export async function resetSquareStates() {
  'use server'
  await db.bingoSquare.updateMany({
    data: {
      isActive: false
    }
  });
  revalidatePath('/admin');
}

export async function updateSquare(row: { id: number, content: string, isActive: boolean }) {
  'use server'
  await db.bingoSquare.update({
    where: {
      id: row.id
    },
    data: {
      content: row.content,
      isActive: row.isActive,
    }
  });
}

export async function activateSquare(id: number) {
  'use server'
  console.log('activateSquare', id);
  await api.bingoSquares.activateSquare.mutate(id);
}

export async function deactivateSquare(id: number) {
  'use server'
  await api.bingoSquares.deactivateSquare.mutate(id);

}