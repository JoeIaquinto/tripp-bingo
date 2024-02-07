
import { type NextRequest, NextResponse } from 'next/server';

import { 
  getSquaresToEvaluate,
  evaluateSquares,
  updateSquaresAndEvent,
  updateBingosForPlayers
} from '~/lib/square-engine/square-updates';

export async function GET(req : NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.error();
  }

  const squareInfos = await getSquaresToEvaluate();
    
  const updatedSquares = evaluateSquares(squareInfos);
  
  const updatedPlayers = await updateSquaresAndEvent(updatedSquares);

  const updatedPlayerBingos = await updateBingosForPlayers(updatedPlayers);

  return NextResponse.json({ ok: true, updatedPlayerBingos });
}
