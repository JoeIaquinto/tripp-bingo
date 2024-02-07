'use server'

import { revalidatePath } from "next/cache";
import { api } from "~/trpc/server";

export interface BingoPatternLine {
  bingoId: number;
  indexPattern: { x: number, y: number }[];
}

interface BingoPatternLineUpdate extends BingoPatternLine {
  id: number;
}

export async function createBingoPatternLine(props: BingoPatternLine) {
  'use server'
  await api.bingoPatterns.createBingoPatternLine.mutate(props)
  revalidatePath('/admin/bingo-patterns');
}

export async function updateBingoPatternLine(props: BingoPatternLineUpdate) {
  'use server'
  await api.bingoPatterns.updateBingoPatternLine.mutate(props)
  revalidatePath('/admin/bingo-patterns');
}

interface BingoPattern {
  name: string;
  description: string;
}

interface BingoPatternUpdate extends BingoPattern {
  id: string;
}

export async function createPattern(props: BingoPattern) {
  'use server'
  await api.bingoPatterns.createBingoPattern.mutate(props)
  revalidatePath('/admin/bingo-patterns');
}

export async function updatePattern(props: BingoPatternUpdate) {
  'use server'
  await api.baseSquares.updateCategory.mutate(props)
  revalidatePath('/admin/bingo-patterns');
}