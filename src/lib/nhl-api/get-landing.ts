
const landingUrl = (gameId: string) => `https://api-web.nhle.com/v1_1/gamecenter/${gameId}/landing`

export interface LandingResponse {
  id: string;
  season: string;
  gameType: number;
  limitedScoring: boolean;
  gameDate: string;
  venue: {
    default: string;
    fr?: string;
  };
  startTimeUTC: string;
  venueUTCOffset: string;
  easternUTCOffset: string;
  gameState: string;
  awayTeam: TeamLandingInfo;
  homeTeam: TeamLandingInfo;
  matchup: {
    teamSeasonStats: {
      awayTeam: {
        ppPctg: number;
        pkPctg: number;
        faceoffWinPctg: number;
        goalsForPerGamePlayed: number;
        goalsAgainstPerGamePlayed: number;
      };
      homeTeam: {
        ppPctg: number;
        pkPctg: number;
        faceoffWinPctg: number;
        goalsForPerGamePlayed: number;
        goalsAgainstPerGamePlayed: number;
      };
    },
    skaterSeasonStats: PlayerLandingStats[]
  }
}

export interface TeamLandingInfo {
  id: number;
  name: {
    default: string;
    fr?: string;
  };
  logo: string;
  record: string;
};

export interface PlayerLandingStats {
  playerId: number;
  teamId: number;
  sweaterNumber: number;
  name: {
    default: string;
    fr?: string;
  };
  position: string;
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  pim: number;
  shots: number;
  faceoffWinPctg: number;
  powerPlayGoals: number;
  hits: number;
};

export async function getLanding(gameId: string): Promise<LandingResponse> {
  const response = await fetch(landingUrl(gameId), {
    next: {
      tags: ["nhl-api", "nhl-games"],
      revalidate: 3600
    },
  });
  const data = await response.json() as LandingResponse;
  return data;
}

export function getPlayers(gameData: LandingResponse): PlayerLandingStats[] {
  return gameData.matchup.skaterSeasonStats;
}

export function getPlayersByTeam(gameData: LandingResponse, homeTeam: boolean): PlayerLandingStats[] {
  return gameData.matchup.skaterSeasonStats.filter(x => x.teamId === (homeTeam ? gameData.homeTeam.id : gameData.awayTeam.id));
}