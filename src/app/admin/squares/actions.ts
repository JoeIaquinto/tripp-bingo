'use server'

import { revalidatePath } from "next/cache";
import { api } from "~/trpc/server";

export interface Square {
  description: string;
  baseGameCategoryId: string;
  skaterType: "F" | "D" | "G" | "Team" | "N/A";
  stat: string;
  rangeMin: number;
  rangeMax: number;
  displayFormat: string;
}

interface SquareUpdate extends Square {
  id: number;
}

export async function createSquare(props: Square) {
  'use server'
  await api.baseSquares.createCategorySquare.mutate(props)
  revalidatePath('/admin/squares');
}

export async function updateSquare(props: SquareUpdate) {
  'use server'
  await api.baseSquares.updateSquare.mutate(props)
  revalidatePath('/admin/squares');
}

interface Category {
  name: string;
  description?: string;
  gameType: "hockey";
}

interface CategoryUpdate extends Category {
  id: string;
}

export async function createCategory(props: Category) {
  'use server'
  await api.baseSquares.createCategory.mutate(props)
  revalidatePath('/admin/squares');
}

export async function updateCategory(props: CategoryUpdate) {
  'use server'
  await api.baseSquares.updateCategory.mutate(props)
  revalidatePath('/admin/squares');
}