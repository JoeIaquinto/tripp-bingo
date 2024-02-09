import { type PlayerLandingStats, type TeamLandingInfo } from "../nhl-api/get-landing";
import type * as gen from "random-seed";
import { type BlockedShotEvent, type FaceoffEvent, type GiveawayEvent, type GoalEvent, type HitEvent, type MissedShotEvent, type PenaltyEvent, type Play, type ShotOnGoalEvent, type StoppageEvent, type TakeawayEvent, type PlayByPlayResponse } from "../nhl-api/get-scoreboard";
import dayjs from "dayjs";

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

export function generate(squareText: BaseHockeySquareData, team: TeamLandingInfo, player: PlayerLandingStats | undefined, rand: gen.RandomSeed): HockeySquareData {
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

export function evaluate(
  squares: HockeySquareData[],
  pbp: PlayByPlayResponse,
  lastEvaluatedEvent: { period: number, timeInPeriod: string }): {
    squares: HockeySquareData[],
    lastEvaluatedEvent: { period: number, timeInPeriod: string }
  } {

  const { period, timeInPeriod } = lastEvaluatedEvent;
  const { plays } = pbp;
  const time = dayjs(timeInPeriod, 'mm:ss');
  const filteredPlays = plays.filter(x => x.period >= period && dayjs(x.timeInPeriod, 'mm:ss') < time);

  const updatedSquares = filteredPlays.flatMap(play => {
    const playType = play.typeDescKey;
    switch(playType) {
      case 'faceoff': {
        return processFaceoff(play, squares);
      }
      case 'hit': {
        return processHit(play, squares);
      }
      case 'stoppage': {
        return processStoppage(play, squares);
      }
      case 'blocked-shot': {
        return processBlockedShot(play, squares, pbp);
      }
      case 'penalty': {
        return processPenalty(play, squares);
      }
      case 'giveaway': {
        return processGiveaway(play, squares);
      }
      case 'shot-on-goal': {
        return processShotOnGoal(play, squares);
      }
      case 'takeaway': {
        return processTakeaway(play, squares);
      }
      case 'goal': {
        return processGoal(play, squares, pbp);
      }
      case 'penalty': {
        return processPenalty(play, squares);
      }
      case 'missed-shot': {
        return processMissedShot(play, squares);
      }
      default: {
        return [];
      }
    }
  });

  const lastPlay = filteredPlays[-1];
  return {
    squares: updatedSquares,
    lastEvaluatedEvent: { period: lastPlay?.period ?? period, timeInPeriod: lastPlay?.timeInPeriod ?? timeInPeriod}
  }
}

function processFaceoff(play: Play, squares: HockeySquareData[]): HockeySquareData[] {
  const details = play.details as FaceoffEvent;
  const filteredSquares = squares.filter(x => x.stat === 'won-faceoff' || x.stat === 'won-offensive-zone-faceoff' || x.stat === 'won-defensive-zone-faceoff');
  return filteredSquares.flatMap(square => {
    const updatedSquares: HockeySquareData[] = [];
    if (square.stat === 'won-faceoff') {
      if (square.playerId && details.winningPlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
      if (!square.playerId && details.eventOwnerTeamId === square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    if (square.stat === 'won-offensive-zone-faceoff' && details.zoneCode === 'O') {
      if (square.playerId && details.winningPlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
      if (!square.playerId && details.eventOwnerTeamId === square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    if (square.stat === 'won-defensive-zone-faceoff' && details.zoneCode === 'D') {
      if (square.playerId && details.winningPlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
      if (!square.playerId && details.eventOwnerTeamId === square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    return updatedSquares;
  });
}

function processHit(play: Play, squares: HockeySquareData[]): HockeySquareData[] {
  const details = play.details as HitEvent;
  const filteredSquares = squares.filter(x => x.stat === 'hit' || x.stat === 'hittee');
  return filteredSquares.flatMap(square => {
    const updatedSquares: HockeySquareData[] = [];
    if (square.stat === 'hit') {
      if (square.playerId && details.hittingPlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
      if (!square.playerId && details.eventOwnerTeamId === square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    if (square.stat === 'hittee') {
      if (square.playerId && details.hitteePlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    return updatedSquares;
  });
}

function processStoppage(play: Play, squares: HockeySquareData[]): HockeySquareData[] {
  const details = play.details as StoppageEvent;
  function match(stat: HockeyStat) : boolean {
    if (stat === 'offside' && details.reason === 'offside') {
      return true;
    }
    if (stat === 'icing' && details.reason === 'icing') { 
      return true;
    }
    if (stat === 'puck-out-of-play' && (details.reason === 'puck-in-netting' || details.reason === 'puck-in-crowd' || details.reason === 'puck-in-benches')) {
      return true;
    }
    return false;
  }
  return squares.filter(x => match(x.stat)).map(x => {
    return {
      ...x,
      currentValue: x.currentValue + 1
    }
  });
}

function processBlockedShot(play: Play, squares: HockeySquareData[], pbp: PlayByPlayResponse): HockeySquareData[] {
  const details = play.details as BlockedShotEvent;
  const filteredSquares = squares.filter(x => x.stat === 'blocked-shot' || x.stat === 'shot-blocked' || x.stat === 'pk-block');
  return filteredSquares.flatMap(square => {
    const updatedSquares: HockeySquareData[] = [];
    if (square.stat === 'blocked-shot') {
      if (square.playerId && details.blockingPlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
      if (!square.playerId && details.eventOwnerTeamId === square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    if (square.stat === 'shot-blocked') {
      if (square.playerId && details.shooterPlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
      if (!square.playerId && details.eventOwnerTeamId !== square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    if (square.stat === 'pk-block') {
      if (square.playerId && details.blockingPlayerId === square.playerId && isOnPk(square.teamId!, play, pbp)) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    return updatedSquares;
  });
}

const stickInfractionDesc = ['slashing', 'hooking', 'tripping', 'high-sticking']

function processPenalty(play: Play, squares: HockeySquareData[]): HockeySquareData[] {
  const details = play.details as PenaltyEvent;
  const filteredSquares = squares.filter(x => x.stat === 'penalty' || x.stat === 'stick-infraction' || x.stat === 'pim' || x.stat === 'major-penalty' || x.stat === 'penalty-drawn');
  return filteredSquares.flatMap(square => {
    const updatedSquares: HockeySquareData[] = [];
    if (square.stat === 'penalty') {
      if (square.playerId && details.committedByPlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
      if (!square.playerId && details.eventOwnerTeamId === square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    if (square.stat === 'stick-infraction' && stickInfractionDesc.some(x => x === details.descKey)) {
      if (square.playerId && details.committedByPlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    if (square.stat === 'pim') {
      if (square.playerId && details.committedByPlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + details.duration
        })
      }
    }
    if (square.stat === 'major-penalty' && details.duration >= 5) {
      if (square.playerId && details.committedByPlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    if (square.stat === 'penalty-drawn') {
      if (square.playerId && details.drawnByPlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    return updatedSquares;
  });
}

function processGiveaway(play: Play, squares: HockeySquareData[]): HockeySquareData[] {
  const details = play.details as GiveawayEvent;
  const filteredSquares = squares.filter(x => x.stat === 'giveaway' || x.stat === 'defensive-zone-giveaway' || x.stat === 'offensive-zone-giveaway');
  return filteredSquares.flatMap(square => {
    const updatedSquares: HockeySquareData[] = [];
    if (square.stat === 'giveaway') {
      if (square.playerId && details.playerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
      if (!square.playerId && details.eventOwnerTeamId === square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    if (square.stat === 'defensive-zone-giveaway' && details.zoneCode === 'D') {
      if (square.playerId && details.playerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
      else if (!square.playerId && details.eventOwnerTeamId === square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    if (square.stat === 'offensive-zone-giveaway' && details.zoneCode === 'O') {
      if (square.playerId && details.playerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
      else if (!square.playerId && details.eventOwnerTeamId === square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    return updatedSquares;
  });
}

function processShotOnGoal(play: Play, squares: HockeySquareData[]): HockeySquareData[] {
  const details = play.details as ShotOnGoalEvent;
  const filteredSquares = squares.filter(x => x.stat === 'shot-on-goal' || x.stat === 'shot-from-defensive-zone' || x.stat === 'shot-wrist' || x.stat === 'shot-tip' || x.stat === 'shot-snap' || x.stat === 'shot-slap' || x.stat === 'shot-backhand');
  return filteredSquares.flatMap(square => {
    const updatedSquares: HockeySquareData[] = [];
    if (square.stat === 'shot-on-goal') {
      if (square.playerId && details.shootingPlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
      if (!square.playerId && details.eventOwnerTeamId === square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    if (square.stat === 'shot-from-defensive-zone' && details.zoneCode === 'D') {
      if (square.playerId && details.shootingPlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
      if (!square.playerId && details.eventOwnerTeamId === square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    const shotTypeToStat: Partial<Record<HockeyStat, string>> = {
      'shot-wrist': 'wrist',
      'shot-tip': 'tip-in',
      'shot-snap': 'snap',
      'shot-slap': 'slap',
      'shot-backhand': 'backhand'
    }
    if (shotTypeToStat[square.stat] === details.shotType) {
      if (square.playerId && details.shootingPlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
      if (!square.playerId && details.eventOwnerTeamId === square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    return updatedSquares;
  });
}

function processTakeaway(play: Play, squares: HockeySquareData[]): HockeySquareData[] {
  const details = play.details as TakeawayEvent;
  const filteredSquares = squares.filter(x => x.stat === 'takeaway' || x.stat === 'defensive-zone-takeaway' || x.stat === 'offensive-zone-takeaway');
  return filteredSquares.flatMap(square => {
    const updatedSquares: HockeySquareData[] = [];
    if (square.stat === 'takeaway') {
      if (square.playerId && details.playerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    if (square.stat === 'defensive-zone-takeaway' && details.zoneCode === 'D') {
      if (square.playerId && details.playerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    if (square.stat === 'offensive-zone-takeaway' && details.zoneCode === 'O') {
      if (square.playerId && details.playerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    return updatedSquares;
  });
}

function processGoal(play: Play, squares: HockeySquareData[], pbp: PlayByPlayResponse): HockeySquareData[] {
  const details = play.details as GoalEvent;
  const filteredSquares = squares.filter(x => x.stat === 'goal' || x.stat === 'point' || x.stat === 'power-play-goal' || x.stat === 'short-handed-goal');
  return filteredSquares.flatMap(square => {
    const updatedSquares: HockeySquareData[] = [];
    if (square.stat === 'goal') {
      if (square.playerId && details.scoringPlayerId === square.playerId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
      if (!square.playerId && details.eventOwnerTeamId === square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    if (square.stat === 'point') {
      if (square.playerId && (details.scoringPlayerId == square.playerId || details.assist1PlayerId === square.playerId || details.assist2PlayerId === square.playerId)) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    if (square.stat === 'power-play-goal' && details.eventOwnerTeamId === square.teamId && isOnPp(square.teamId, play, pbp)) {
      updatedSquares.push({
        ...square,
        currentValue: square.currentValue + 1
      })
    }
    if (square.stat === 'short-handed-goal' && details.eventOwnerTeamId === square.teamId && isOnPk(square.teamId, play, pbp)) {
      updatedSquares.push({
        ...square,
        currentValue: square.currentValue + 1
      })
    }
    return updatedSquares;
  });
}

function processMissedShot(play: Play, squares: HockeySquareData[]): HockeySquareData[] {
  const details = play.details as MissedShotEvent;
  const filteredSquares = squares.filter(x => x.stat === 'post');
  return filteredSquares.flatMap(square => {
    const updatedSquares: HockeySquareData[] = [];
    if (details.reason === 'hit-crossbar' || details.reason === 'hit-post') {
      if (details.eventOwnerTeamId === square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
      if (!square.teamId) {
        updatedSquares.push({
          ...square,
          currentValue: square.currentValue + 1
        })
      }
    }
    return updatedSquares;
  });
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

