import { type NextRequest, NextResponse } from 'next/server';

import { api } from "~/trpc/server";

export async function GET(req : NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.error();
  }

  await api.game.updateExpiredGames.mutate();

  return NextResponse.json({ ok: true });
}