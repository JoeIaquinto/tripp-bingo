"use client"
import { api } from "~/trpc/react";

export default function GetBoard() {
  const {data, isFetching, error} = api.bingoBoard.getRandomSquares.useQuery(undefined, {
    refetchInterval: 15000,
    refetchOnMount: false,
  });

  const bingoState = api.bingoState.getBingoState.useQuery(undefined, {
    refetchInterval: 30000,
    initialData: undefined,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

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
  <section className="min-w-fit py-12 h-1/2">
    <div className="container px-4 md:px-6">
      {bingoState.data ? <div className="flex flex-row items-center text-lg mb-4">{bingoState.data?.message}</div> : null}
      <div className="flex flex-col items-center justify-items-center gap-4 md:gap-8">
        <div className="grid grid-cols-5 gap-4 w-full grid-rows-5">
          {
            data.map((item, index) => {
              const statusBackgroundClass = item.isActive ? "bg-green-500" : "bg-gray-200";
              const statusForegroundClass = item.isActive ? "text-white" : "text-gray-700";
              return (
              <div key={index} className={`relative group flex rounded-lg p-4 place-content-evenly ${statusBackgroundClass} text-center`}>
                <div>
                  <span className={`${statusForegroundClass} font-bold text-center`}>{item.content}</span>
                  {item.inBingo ? <div className="absolute -inset-1 bg-green-500 rounded-lg blur opacity-50 -z-50"></div> : null}
                </div>
              </div>
            )})
          }
        </div>
      </div>
    </div>
  </section>);
}

