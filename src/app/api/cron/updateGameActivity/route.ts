import { type NextRequest, NextResponse } from 'next/server';
import { db } from '~/server/db';

export async function GET(req : NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
      statusText: 'Unauthorized'
    });
  }
  await db.game.updateMany({
    where: {
      createdAt: {
        lte: new Date(new Date().getTime() - 60 * 60 * 1000 * 6),
        gte: new Date(new Date().getTime() - 60 * 60 * 1000 * 12)
      },
      active: true,
    },
    data: {
      active: false,
      joinCode: undefined
    }
  });

  return NextResponse.json({ ok: true });
}