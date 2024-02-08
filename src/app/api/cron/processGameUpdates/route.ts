
import { type NextRequest, NextResponse } from 'next/server';

import { 
  getSquaresToEvaluate,
  evaluateSquares,
  updateSquaresAndEvent,
  updateBingosForPlayers
} from '~/lib/square-engine/square-updates';

export const maxDuration = 300;

export async function GET(req : NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.error();
  }
  console.log('Processing game updates');

  const squareInfos = await getSquaresToEvaluate();
  console.log('Got squares to evaluate', squareInfos.length);
  const updatedSquares = evaluateSquares(squareInfos);
  console.log('Evaluated squares', updatedSquares.length);
  const updatedPlayers = await updateSquaresAndEvent(updatedSquares);
  console.log('Updated squares and events', updatedPlayers.length);
  const updatedPlayerBingos = await updateBingosForPlayers(updatedPlayers);
  console.log('Updated player bingos', updatedPlayerBingos.length);
  return NextResponse.json({ ok: true, updatedPlayerBingos });
}
