const nhlScoreboardUrl = "https://api-web.nhle.com/v1/gamecenter/";

interface PeriodStats {
  period: number;
  periodDescriptor: {
    number: number;
    periodType: string;
  },
  away: number;
  home: number;
}

interface BasePlayerStat {
  name: {
    default: string;
  };
  playerId: number;
  position: string;
  sweaterNumber: number;
  toi: string;
  pim: number;
}

interface PlayerStats {
  defense: SkaterStats[];
  forwards: SkaterStats[];
  goalies: GoalieStats[];
}
interface SkaterStats extends BasePlayerStat {
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  hits: number;
  blockedShots: number;
  powerPlayGoals: number;
  powerPlayPoints: number;
  shorthandedGoals: number;
  shPoints: number;
  shots: number;
  faceoffs: string;
  faceoffWinningPctg: number;
  powerPlayToi: string;
  shorthandedToi: string
}
interface GoalieStats extends BasePlayerStat {
  evenStrengthShotsAgainst: string;
  powerPlayShotsAgainst: string;
  shorthandedShotsAgainst: string;
  saveShotsAgainst: string;
  evenStrengthGoalsAgainst: number;
  powerPlayGoalsAgainst: number;
  shorthandedGoalsAgainst: number;
  goalsAgainst: number;
}

interface BoxScore {
  gameId: string;
  lineScore: {
    byPeriod: PeriodStats[];
    totals: {
      away: number;
      home: number;
    };
  };
  shotsByPeriod: PeriodStats[];
  playerByGameStats: {
    awayTeam: PlayerStats;
    homeTeam: PlayerStats;
  }
}

interface TeamInfo {
  id: number;
  name: {
    default: string;
    fr?: string;
  };
  score?: number;
  sog?: number;
  onIce: number[];
  logo: string;
  abbrev: string;
}

interface BaseGameResponse {
  id: string;
  gameState: string;
  period: number;
  periodDescriptor: {
    number: number;
    periodType: string;
  };
  clock: {
    timeRemaining: string;
    secondsRemaining: number;
    running: boolean;
    inIntermission: boolean;
  };
  awayTeam: TeamInfo;
  homeTeam: TeamInfo;
  situation: {
    homeTeam: {
        abbrev: string,
        strength: number;
        situationDescriptions?: string[],
    },
    awayTeam: {
        abbrev: string,
        situationDescriptions?: string[],
        strength: number;
    },
    situationCode: string;
    timeRemaining: string;
    secondsRemaining: string;
  },
  startTimeUTC?: string;
  gameOutcome?: {
    lastPeriodType: string;
    otPeriods?: number;
  };
}

export interface BoxScoreResponse extends BaseGameResponse {
  boxscore: BoxScore;
};

export interface PlayByPlayResponse extends BaseGameResponse {
  plays: {
    eventId: number;
    period: number;
    periodDescriptor: {
      number: number;
      periodType: string;
    };
    timeInPeriod: string;
    timeRemaining: string;
    situationCode: string;
    homeTeamDefendingSide: string;
    typeCode: number;
    typeDescKey: string;
    sortOrder: number;
    details: FaceoffEvent | MissedShotEvent | StoppageEvent | HitEvent | BlockedShotEvent | GiveawayEvent | ShotOnGoalEvent | TakeawayEvent | GoalEvent | PenaltyEvent | undefined;
  }[];
}

interface FaceoffEvent {
  eventOwnerTeamId: number;
  losingPlayerId: number;
  winningPlayerId: number;
  xCoord: number;
  yCoord: number;
  zoneCode: string;
}

interface MissedShotEvent {
  xCoord: number;
  yCoord: number;
  zoneCode: string;
  reason: string;
  shotType: string;
  shootingPlayerId: number;
  goalieInNetId: number;
  eventOwnerTeamId: number;
}

interface StoppageEvent {
  reason: string;
}

interface HitEvent {
  xCoord: number;
  yCoord: number;
  zoneCode: string;
  eventOwnerTeamId: number;
  hittingPlayerId: number;
  hitteePlayerId: number;
}

interface BlockedShotEvent {
  xCoord: number;
  yCoord: number;
  zoneCode: string;
  eventOwnerTeamId: number;
  blockingPlayerId: number;
  shooterPlayerId: number;
}

interface GiveawayEvent {
  xCoord: number;
  yCoord: number;
  zoneCode: string;
  eventOwnerTeamId: number;
  playerId: number;
}

interface ShotOnGoalEvent {
  xCoord: number;
  yCoord: number;
  zoneCode: string;
  shotType: string;
  shootingPlayerId: number;
  goalieInNetId: number;
  eventOwnerTeamId: number;
  awaySOG: number;
  homeSOG: number;
}

interface TakeawayEvent {
  xCoord: number;
  yCoord: number;
  zoneCode: string;
  eventOwnerTeamId: number;
  playerId: number;
}

interface GoalEvent {
  eventOwnerTeamId: number;
  xCoord: number;
  yCoord: number;
  zoneCode: string;
  shotType: string;
  scoringPlayerId: number;
  scoringPlayerTotal: number;
  assist1PlayerId?: number;
  assist1PlayerTotal?: number;
  assist2PlayerId?: number;
  assist2PlayerTotal?: number;
  goalieInNetId: number;
  awayScore: number;
  homeScore: number;
}

interface PenaltyEvent {
  xCoord: number;
  yCoord: number;
  zoneCode: string;
  typeCode: string;
  descKey: string;
  duration: number;
  committedByPlayerId: number;
  drawnByPlayerId: number;
  eventOwnerTeamId: number;
}

export const getBoxScore = async (gameId: string) => {
  const url = `${nhlScoreboardUrl}${gameId}/boxscore`;
  const response = await fetch(url, {
    next: {
      tags: ["nhl-api", "boxscore", gameId],
      revalidate: 30
    },
  });
  const data = await response.json() as BoxScoreResponse;
  return data;
};

export const getPlayByPlay = async (gameId: string) => {
  const url = `${nhlScoreboardUrl}${gameId}/play-by-play`;
  const response = await fetch(url, {
    next: {
      tags: ["nhl-api", "play-by-play", gameId],
      revalidate: 30
    },
  });
  const data = await response.json() as PlayByPlayResponse;
  return data;
};