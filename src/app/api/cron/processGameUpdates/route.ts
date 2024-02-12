
import { type NextRequest, NextResponse } from 'next/server';
import { evaluate } from '~/lib/square-engine/square-interpreter';

import { 
  getEventsToEvaluate as getEventsToEvaluate,
  updateSquaresAndEvent,
  updateBingosForPlayers
} from '~/lib/square-engine/square-updates';

export const maxDuration = 300;

export async function GET(req : NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
      statusText: 'Unauthorized'
    });
  }
  console.log('Processing game updates');

  const events = await getEventsToEvaluate();
  console.log('Got events to evaluate', events.length);
  const updatedSquares = events.map(({ hockeySquareData, pbp, lastEvaluatedEvent, eventId }) => {
    console.log('Evaluating event', eventId, `${pbp?.awayTeam.name.default}@${pbp?.homeTeam.name.default}`)
    const updatedSquares = evaluate(hockeySquareData, pbp!, lastEvaluatedEvent);
    console.log('Updated squares', updatedSquares.squares.length);
    return {
      squares: updatedSquares.squares,
      eventId,
      lastEvaluatedEvent: updatedSquares.lastEvaluatedEvent,
    };
  });;
  const updatedPlayers = await updateSquaresAndEvent(updatedSquares);
  console.log('Updated squares and events', updatedPlayers.length);
  const updatedPlayerBingos = await updateBingosForPlayers(updatedPlayers);
  console.log('Updated player bingos', updatedPlayerBingos.length);
  return NextResponse.json({ ok: true });
}
