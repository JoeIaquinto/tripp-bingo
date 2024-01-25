import dayjs from 'dayjs';

const nowScoreboardUrl = "https://api-web.nhle.com/v1/scoreboard/now";

interface NowScoreboardResponse {
  gamesByDate: {
    date: string;
    games: {
      id: string;
      awayTeam: {
        id: number;
        name: {
          default: string;
          fr: string;
        }
      },
      homeTeam: {
        id: number;
        name: {
          default: string;
          fr: string;
        }
      },
      startTimeUTC: string;
    }[]
  }[]
}

export interface GameInfo {
  id: string;
  awayTeam: string;
  homeTeam: string;
  gameName: string;
  puckDrop: string;
}

export const getGames = async (): Promise<GameInfo[]> => {
  const response = await fetch(nowScoreboardUrl, {
    next: {
      tags: ["nhl-api", "nhl-games"],
      revalidate: 3600
    },
  });
  const data = await response.json() as NowScoreboardResponse;
  return data.gamesByDate.filter(x => x.date === dayjs().format('YYYY-MM-DD')).flatMap(x => {
    return x.games.map(game => {
      return {
        id: game.id.toString(),
        awayTeam: game.awayTeam.name.default,
        homeTeam: game.homeTeam.name.default,
        gameName: `${game.awayTeam.name.default} @ ${game.homeTeam.name.default}`,
        puckDrop: dayjs(game.startTimeUTC).format('h:mm A'),
      }
    })
  });
}