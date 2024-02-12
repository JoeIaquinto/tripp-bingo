import { type LandingResponse, type PlayerLandingStats, type TeamLandingInfo } from "../nhl-api/get-landing";
import type * as gen from "random-seed";
import { type BlockedShotEvent, type FaceoffEvent, type GiveawayEvent, type GoalEvent, type HitEvent, type MissedShotEvent, type PenaltyEvent, type Play, type ShotOnGoalEvent, type StoppageEvent, type TakeawayEvent, type PlayByPlayResponse } from "../nhl-api/get-scoreboard";
import { getRandomElement } from "../rand";

/* 
  What information can we get out of the PBP?

  - Faceoff
    - Forwards only
    - Won (team/ player)
    - Offensive zone win (team)
    - Defensive zone win (team)
  - Hit
    - Hitter (team/ player)
    - Hittee (team/ player)
  - Stoppage
    - Puck out of play
    - Icing
    - Offside
  - Blocked shot
    - Blocks (team/ player)
    - Shooting (player) - primarily defense
    - PK Blocks
  - Penalty
    - Raw penalty (team/ player)
    - Penalty type
    - Penalty minutes (team)
    - Major penalty
    - Penalty drawn (player)
  - Giveaway
    - Raw giveaway (team/ player)
    - Defensive zone giveaway (team/ player)
    - Offensive zone giveaway (team/ player)
  - Takeaway
    - Raw takeaway (team/ player)
    - Defensive zone takeaway (team/ player)
    - Offensive zone takeaway (team/ player)
  - Shot on goal
    - Raw shot (team/ player)
    - Shot by type (general/ team/ player)
    - Shot from defensive zone
  - Missed Shot
    - Post/Crossbar (general/ team)
  - Goal
    - Raw goal (general/ team/ player)
    - Goal by type (general/ team)
    - Raw point (player)
    - Power play goal (general/ team)
    - Short handed goal (general/ team)
    - Empty net goal (general/ team)
*/

export type SkaterType = 'F' | 'D' | 'G' | 'Team' | 'N/A';

export type HockeyStat = 'won-faceoff' | 'won-offensive-zone-faceoff' | 'won-defensive-zone-faceoff'
  | 'hit' | 'hittee'
  | 'puck-out-of-play' | 'icing' | 'offside'
  | 'blocked-shot' | 'shot-blocked' | 'pk-block'
  | 'penalty' | 'stick-infraction' | 'pim' | 'major-penalty' | 'penalty-drawn'
  | 'giveaway' | 'defensive-zone-giveaway' | 'offensive-zone-giveaway'
  | 'takeaway' | 'defensive-zone-takeaway' | 'offensive-zone-takeaway'
  | 'shot-on-goal' | 'shot-from-defensive-zone' | 'shot-wrist' | 'shot-tip' | 'shot-snap' | 'shot-slap' | 'shot-backhand'
  | 'post'
  | 'goal' | 'point' | 'power-play-goal' | 'short-handed-goal';

export interface BaseHockeySquareData {
  skaterType: SkaterType;
  stat: HockeyStat;
  rangeMin: number;
  rangeMax: number;
}

export interface HockeySquareData {
  squareId?: string;
  stat: HockeyStat;
  value: number;
  playerId?: number;
  teamId?: number;
  currentValue: number;
  skaterType: SkaterType;
}

export function generateV2(baseSquares: BaseHockeySquareData[], event: LandingResponse, rand: gen.RandomSeed): HockeySquareData {

  
  const square = getRandomElement(baseSquares, rand);
  
  if (square.skaterType === 'N/A') {
    return {
      value: rand.intBetween(square.rangeMin, square.rangeMax) + 0.5,
      stat: square.stat,
      skaterType: square.skaterType,
      currentValue: 0,
    }
  }
  const { homeTeam, awayTeam, matchup } = event;
  const useHome = rand.random() > 0.5;
  const team = useHome ? homeTeam : awayTeam;

  if (square.skaterType === 'Team') {
    return {
      value: rand.intBetween(square.rangeMin, square.rangeMax) + 0.5,
      stat: square.stat,
      teamId: team.id,
      skaterType: square.skaterType,
      currentValue: 0,
    }
  }

  const players = matchup.skaterSeasonStats
    .filter(x => x.teamId === team.id)
    .filter(x => x.position === square.skaterType || (square.skaterType === 'F' ? (x.position === 'L' || x.position === 'R' || x.position === 'C') : false));
  
  const playersSortedByStat = players.sort((a, b) => {
    switch (square.stat) {
      case 'won-faceoff':
      case 'won-offensive-zone-faceoff':
      case 'won-defensive-zone-faceoff':
        return b.faceoffWinPctg - a.faceoffWinPctg;
      case 'hit':
        return b.hits - a.hits;
      case 'shot-on-goal':
        return b.shots - a.shots;
      case 'short-handed-goal':
      case 'goal':
        return b.goals - a.goals;
      case 'power-play-goal':
        return b.powerPlayGoals - a.powerPlayGoals;
      case 'point':
        return b.points - a.points;
      case 'pim':
      case 'major-penalty':
      case 'penalty':
      case 'stick-infraction':
        return b.pim - a.pim;
      case 'penalty-drawn':
      case 'pk-block':
        return a.pim - b.pim;
      default:
        return 0;
    }
  })
  .slice(0, players.length / 2); // take top 50% of players on the team for the statsitic

  const player = getRandomElement(playersSortedByStat, rand);
  return {
    value: rand.intBetween(square.rangeMin, square.rangeMax) + 0.5,
    stat: square.stat,
    playerId: player.playerId,
    teamId: team.id,
    skaterType: square.skaterType,
    currentValue: 0,
  }

}

export function generate({ squareText, team, player, rand }: { squareText: BaseHockeySquareData; team: TeamLandingInfo; player: PlayerLandingStats | undefined; rand: gen.RandomSeed; }): HockeySquareData {
  const { skaterType, stat, rangeMin, rangeMax } = squareText;

  if (skaterType === 'N/A') {
    return {
      value: rand.intBetween(rangeMin, rangeMax) + 0.5,
      stat: stat,
      skaterType: skaterType,
      currentValue: 0,
    }
  }
  if (!player) {
    return {
      value: rand.intBetween(rangeMin, rangeMax) + 0.5,
      stat: stat,
      teamId: team.id,
      skaterType: skaterType,
      currentValue: 0,
    }
  }

  return {
    value: rand.intBetween(rangeMin, rangeMax) + 0.5,
    stat: stat,
    skaterType: skaterType,
    playerId: player.playerId,
    teamId: team.id,
    currentValue: 0,
  }
}

function parsePeriodTime(time: string) {
  return parseInt(time.substring(0,2)) * 60 + parseInt(time.substring(3,5));
}

interface SquareUpdate {
  square: HockeySquareData;
  value: number;
}

export function evaluate(
  squares: HockeySquareData[],
  pbp: PlayByPlayResponse,
  lastEvaluatedEvent: { period: number, timeInPeriod: string }): {
    squares: HockeySquareData[],
    lastEvaluatedEvent: { period: number, timeInPeriod: string }
  } {

  const { period, timeInPeriod } = lastEvaluatedEvent;
  const { plays } = pbp;
  
  console.log(plays);
  const time =  parsePeriodTime(timeInPeriod);
  const filteredPlays = plays.filter(x => x.period >= period && parsePeriodTime(x.timeInPeriod) > time);

  console.log("Filtered plays count: ", filteredPlays.length);
  const updated: SquareUpdate[] = squares.map(square => {
    return {
      square,
      value: square.currentValue
    }
  });

  filteredPlays.forEach(play => {
    const playType = play.typeDescKey;
    console.log({
      playType,
      period: play.period,
      timeInPeriod: play.timeInPeriod
    })

    switch(playType) {
      case 'faceoff': {
        processFaceoff(play, updated);
        break;
      }
      case 'hit': {
        processHit(play, updated);
        break;
      }
      case 'stoppage': {
        processStoppage(play, updated);
        break;
      }
      case 'blocked-shot': {
        processBlockedShot(play, updated, pbp);
        break;
      }
      case 'penalty': {
        processPenalty(play, updated);
        break;
      }
      case 'giveaway': {
        processGiveaway(play, updated);
        break;
      }
      case 'shot-on-goal': {
        processShotOnGoal(play, updated);
        break;
      }
      case 'takeaway': {
        processTakeaway(play, updated);
        break;
      }
      case 'goal': {
        processGoal(play, updated, pbp);
        break;
      }
      case 'penalty': {
        processPenalty(play, updated);
        break;
      }
      case 'missed-shot': {
        processMissedShot(play, updated);
        break;
      }
      default: {
        
      }
    }
    console.log("Updated squares: ", updated);
    return updated;
  });

  // get last event by period and time
  const lastPlay = plays.reduce((acc, play) => {
    if (play.period > acc.period) {
      return play;
    }
    if (play.period === acc.period && parsePeriodTime(play.timeInPeriod) > parsePeriodTime(acc.timeInPeriod)) {
      return play;
    }
    return acc;
  }, { period: 1, timeInPeriod: '00:00' });
  console.log("Last play: ", lastPlay);
  return {
    squares: updated.map(x => {
      return {
        ...x.square,
        currentValue: x.value
      }
    }),
    lastEvaluatedEvent: {
      period: lastPlay.period,
      timeInPeriod: lastPlay.timeInPeriod
    }
  }
}

function processFaceoff(play: Play, update: SquareUpdate[]) {
  const details = play.details as FaceoffEvent;
  const wonFaceoffSquares = update.filter(x => x.square.stat === 'won-faceoff');
  const wonOffensiveFaceoffSquares = update.filter(x => x.square.stat === 'won-offensive-zone-faceoff' && details.zoneCode === 'O');
  const wonDefensiveFaceoffSquares = update.filter(x => x.square.stat === 'won-defensive-zone-faceoff' && details.zoneCode === 'D');

  wonFaceoffSquares.forEach(update => {
    if (update.square.playerId && details.winningPlayerId === update.square.playerId) {
      update.value += 1;
    }
    if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
      update.value += 1;
    }
  });
  wonOffensiveFaceoffSquares.forEach(update => {
    if (update.square.playerId && details.winningPlayerId === update.square.playerId) {
      update.value += 1;
    }
    if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
      update.value += 1;
    }
  });
  wonDefensiveFaceoffSquares.forEach(update => {
    if (update.square.playerId && details.winningPlayerId === update.square.playerId) {
      update.value += 1;
    }
    if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
      update.value += 1;
    }
  });
}

function processHit(play: Play, update: SquareUpdate[]) {
  const details = play.details as HitEvent;
  const hitSquares = update.filter(x => x.square.stat === 'hit');
  const hitteeSquares = update.filter(x => x.square.stat === 'hittee');

  hitSquares.forEach(update => {
    if (update.square.playerId && details.hittingPlayerId === update.square.playerId) {
      update.value += 1;
    }
    if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
      update.value += 1;
    }
  });
  hitteeSquares.forEach(update => {
    if (update.square.playerId && details.hitteePlayerId === update.square.playerId) {
      update.value += 1;
    }
    if (!update.square.playerId && details.eventOwnerTeamId !== update.square.teamId) {
      update.value += 1;
    }
  });
}

function processStoppage(play: Play, updates: SquareUpdate[]) {
  const details = play.details as StoppageEvent;
  switch (details.reason) {
    case 'offside': {
      updates.filter(x => x.square.stat === 'offside').forEach(update => {
        update.value += 1;
      })
    }
    case 'icing': {
      updates.filter(x => x.square.stat === 'icing').forEach(update => {
        update.value += 1;
      })
    }
    case 'puck-in-netting':
    case 'puck-in-crowd':
    case 'puck-in-benches': {
      updates.filter(x => x.square.stat === 'puck-out-of-play').forEach(update => {
        update.value += 1;
      })
    }
  }
}

function processBlockedShot(play: Play, update: SquareUpdate[], pbp: PlayByPlayResponse) {
  const details = play.details as BlockedShotEvent;

  const blockedShot = update.filter(x => x.square.stat === 'blocked-shot');
  const shotBlocked = update.filter(x => x.square.stat === 'shot-blocked');

  blockedShot.forEach(update => {
    if (update.square.playerId && details.blockingPlayerId === update.square.playerId) {
      update.value += 1;
    }
    if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
      update.value += 1;
    }
  });

  shotBlocked.forEach(update => {
    if (update.square.playerId && details.shooterPlayerId === update.square.playerId) {
      update.value += 1;
    }
    if (!update.square.playerId && details.eventOwnerTeamId !== update.square.teamId) {
      update.value += 1;
    }
  });

  if (isOnPk(details.eventOwnerTeamId, play, pbp)) {
    update.filter(x => x.square.stat === 'pk-block').forEach(update => {
      if (update.square.playerId && details.blockingPlayerId === update.square.playerId) {
        update.value += 1;
      }
      if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
        update.value += 1;
      }
    });
  }
}

const stickInfractionDesc = ['slashing', 'hooking', 'tripping', 'high-sticking']

function processPenalty(play: Play, update: SquareUpdate[]) {
  const details = play.details as PenaltyEvent;
  const penalty = update.filter(x => x.square.stat === 'penalty');
  const pim = update.filter(x => x.square.stat === 'pim');
  const penaltyDrawn = update.filter(x => x.square.stat === 'penalty-drawn');

  penalty.forEach(update => {
    if (update.square.playerId && details.committedByPlayerId === update.square.playerId) {
      update.value += 1;
    }
    if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
      update.value += 1;
    }
  });

  pim.forEach(update => {
    if (update.square.playerId && details.committedByPlayerId === update.square.playerId) {
      update.value += details.duration;
    }
    if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
      update.value += details.duration;
    }
  });

  penaltyDrawn.forEach(update => {
    if (update.square.playerId && details.drawnByPlayerId === update.square.playerId) {
      update.value += 1;
    }
    if (!update.square.playerId && details.eventOwnerTeamId !== update.square.teamId) {
      update.value += 1;
    }
  });

  if (stickInfractionDesc.some(x => x === details.descKey)) {
    update.filter(x => x.square.stat === 'stick-infraction').forEach(update => {
      if (update.square.playerId && details.committedByPlayerId === update.square.playerId) {
        update.value += 1;
      }
      if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
        update.value += 1;
      }
    });
  }

  if (details.duration >= 5) {
    update.filter(x => x.square.stat === 'major-penalty').forEach(update => {
      if (update.square.playerId && details.committedByPlayerId === update.square.playerId) {
        update.value += 1;
      }
      if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
        update.value += 1;
      }
    });
  }
}

function processGiveaway(play: Play, updates: SquareUpdate[]) {
  const details = play.details as GiveawayEvent;
  const giveaway = updates.filter(x => x.square.stat === 'giveaway');

  giveaway.forEach(update => {
    if (update.square.playerId && details.playerId === update.square.playerId) {
      update.value += 1;
    }
    if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
      update.value += 1;
    }
  });
  if (details.zoneCode === 'D') {
    (updates.filter(x => x.square.stat === 'defensive-zone-giveaway')).forEach(update => {
      if (update.square.playerId && details.playerId === update.square.playerId) {
        update.value += 1;
      }
      if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
        update.value += 1;
      }
    });
  }
  if (details.zoneCode === 'O') {
    (updates.filter(x => x.square.stat === 'offensive-zone-giveaway')).forEach(update => {
      if (update.square.playerId && details.playerId === update.square.playerId) {
        update.value += 1;
      }
      if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
        update.value += 1;
      }
    });
  }
}

const shotTypeToStat: Partial<Record<string, string>> = {
  'wrist': 'shot-wrist',
  'tip-in': 'shot-tip',
  'snap': 'shot-snap',
  'slap': 'shot-slap',
  'backhand': 'shot-backhand'
};

function processShotOnGoal(play: Play, updates: SquareUpdate[]) {
  const details = play.details as ShotOnGoalEvent;
  const shotOnGoal = updates.filter(x => x.square.stat === 'shot-on-goal');

  updates.filter(x => x.square.stat === shotTypeToStat[details.shotType]).forEach(update => {
    if (update.square.playerId && details.shootingPlayerId === update.square.playerId) {
      update.value += 1;
    }
    if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
      update.value += 1;
    }
  });
  shotOnGoal.forEach(update => {
    if (update.square.playerId && details.shootingPlayerId === update.square.playerId) {
      update.value += 1;
    }
    if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
      update.value += 1;
    }
  });
  if (details.zoneCode === 'D') {
    (updates.filter(x => x.square.stat === 'shot-from-defensive-zone')).forEach(update => {
      if (update.square.playerId && details.shootingPlayerId === update.square.playerId) {
        update.value += 1;
      }
      if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
        update.value += 1;
      }
    });
  }
}

function processTakeaway(play: Play, updates: SquareUpdate[]) {
  const details = play.details as TakeawayEvent;
  const takeaway = updates.filter(x => x.square.stat === 'takeaway');

  takeaway.forEach(update => {
    if (update.square.playerId && details.playerId === update.square.playerId) {
      update.value += 1;
    }
    if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
      update.value += 1;
    }
  });

  if (details.zoneCode === 'D') {
    (updates.filter(x => x.square.stat === 'defensive-zone-takeaway')).forEach(update => {
      if (update.square.playerId && details.playerId === update.square.playerId) {
        update.value += 1;
      }
      if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
        update.value += 1;
      }
    });
  }
  if (details.zoneCode === 'O') {
    (updates.filter(x => x.square.stat === 'offensive-zone-takeaway')).forEach(update => {
      if (update.square.playerId && details.playerId === update.square.playerId) {
        update.value += 1;
      }
      if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
        update.value += 1;
      }
    });
  }
}

function processGoal(play: Play, updates: SquareUpdate[], pbp: PlayByPlayResponse) {
  const details = play.details as GoalEvent;
  const goal = updates.filter(x => x.square.stat === 'goal');
  const point = updates.filter(x => x.square.stat === 'point');

  goal.forEach(update => {
    if (update.square.stat === 'goal') {
      if (update.square.playerId && details.scoringPlayerId === update.square.playerId) {
        update.value += 1;
      }
      if (!update.square.playerId && details.eventOwnerTeamId === update.square.teamId) {
        update.value += 1;
      }
    }
  });

  point.forEach(update => {
    if (update.square.playerId && (details.scoringPlayerId == update.square.playerId || details.assist1PlayerId === update.square.playerId || details.assist2PlayerId === update.square.playerId)) {
      update.value += 1;
    }
  });

  if (isOnPp(details.eventOwnerTeamId, play, pbp)) {
    (updates.filter(x => x.square.stat === 'power-play-goal')).forEach(update => {
      if (update.square.teamId === details.eventOwnerTeamId) {
        update.value += 1;
      }
    });
  }
  if (isOnPk(details.eventOwnerTeamId, play, pbp)) {
    (updates.filter(x => x.square.stat === 'short-handed-goal')).forEach(update => {
      if (update.square.teamId === details.eventOwnerTeamId) {
        update.value += 1;
      }
    });
  }
}

function processMissedShot(play: Play, updates: SquareUpdate[]) {
  const details = play.details as MissedShotEvent;
  if (details.reason === 'hit-crossbar' || details.reason === 'hit-post') {
    updates.filter(x => x.square.stat === 'post').forEach(update => {
      if (details.eventOwnerTeamId === update.square.teamId) {
        update.value += 1;
      }
      if (!update.square.teamId) {
        update.value += 1;
      }
    });
  }
}

function getTeamSide(teamId: number, play: Play, gameInfo: PlayByPlayResponse) {
  const isTeamHome = teamId === gameInfo.homeTeam.id;
  const sideOfTeam = isTeamHome ? play.homeTeamDefendingSide : (play.homeTeamDefendingSide === 'left' ? 'right' : 'left');
  return sideOfTeam;
}

function isOnPk(teamId: number, play: Play, gameInfo: PlayByPlayResponse) {
  const sideOfTeam = getTeamSide(teamId, play, gameInfo);
  const teamOnLeftSkaters = parseInt(play.situationCode[1]!);
  const teamOnRightSkaters = parseInt(play.situationCode[2]!);

  if (sideOfTeam === 'left') {
    return teamOnLeftSkaters < teamOnRightSkaters;
  } else {
    return teamOnRightSkaters < teamOnLeftSkaters;
  }
}

function isOnPp(teamId: number, play: Play, gameInfo: PlayByPlayResponse) {
  const sideOfTeam = getTeamSide(teamId, play, gameInfo);
  const teamOnLeftSkaters = parseInt(play.situationCode[1]!);
  const teamOnRightSkaters = parseInt(play.situationCode[2]!);
  if (sideOfTeam === 'left') {
    return teamOnLeftSkaters > teamOnRightSkaters;
  }
  else {
    return teamOnRightSkaters > teamOnLeftSkaters;
  }
}

