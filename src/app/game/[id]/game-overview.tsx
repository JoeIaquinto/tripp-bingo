"use client"

import dayjs from "dayjs";
import Image from "next/image";
import { type BoxScoreResponse } from "~/lib/nhl-api/get-scoreboard";
import { api } from "~/trpc/react";

export function GameOverview({id}: {id: number}) {
  const {data, isFetching, error} = api.game.getBoxScore.useQuery({ id }, {
    refetchInterval: 30000,
    initialData: undefined,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (isFetching && !data) {
    return <div>Loading...</div>
  }
  if (error) {
    return <div>Error: {error.message}</div>
  }
  if (!data) {
    return <div>No data</div>
  }
  
  return (
    <div className="px-2 flex">
      <div className="container rounded-sm border space-y-2 py-2 flex items-center flex-col">
        <div className="flex flex-row space-x-2">
          <div className="flex flex-row items-center">
            <Image src={data.awayTeam.logo} alt={data.awayTeam.name.default} width={100} height={100} />
            <span className="text-primary text-lg">{data.awayTeam.abbrev}</span>
            <span className="text-primary text-lg pl-2">{data.awayTeam.score}</span>
          </div>
          {
            data.gameState === "LIVE" ? (
              renderClockAndPeriod(data)) : 
              data.gameState === "FUT" ? (
              renderPuckDrop(data)
              ) : (
                renderFinal(data)
              )}
          <div className="flex flex-row items-center">
            <span className="text-primary text-lg pr-2">{data.homeTeam.score}</span>
            <span className="text-primary text-lg">{data.homeTeam.abbrev}</span>
            <Image src={data.homeTeam.logo} alt={data.homeTeam.name.default} width={100} height={100} />
          </div>
        </div>
      </div>
    </div>
  );
}

function renderClockAndPeriod(data: BoxScoreResponse) {
  return <div className="flex flex-col items-center">
    <div className="h-2"></div>
    <span className="text-primary text-md">{data.clock.timeRemaining}</span>
    <span className="text-primary text-md">{data.period}{data.period === 1 ? "ST" : data.period <= 3 ? "RD" : " OT"}</span>
  </div>;
}

function renderPuckDrop(data: BoxScoreResponse) {
  return <div className="flex flex-col items-center">
    <div className="h-2"></div>
    <span className="text-primary text-md">Puck Drop</span>
    <span className="text-primary text-md">{dayjs(data.startTimeUTC).format('h:mm A')}</span>
  </div>;
}

function renderFinal(data: BoxScoreResponse) {
  function getNonRegPeriod() {
    if (data.gameOutcome?.lastPeriodType === "OT") {
      if (data.gameOutcome.otPeriods === 1)
        return "/OT";
      return "/OT" + data.gameOutcome.otPeriods;
    }
    if (data.gameOutcome?.lastPeriodType === "SO") {
      return "/SO";
    }
    return "";
  }

  return <div className="flex flex-col items-center">
    <div className="flex-grow"></div>
    <span className="text-primary text-md">FINAL{getNonRegPeriod()}</span>
  </div>;
}