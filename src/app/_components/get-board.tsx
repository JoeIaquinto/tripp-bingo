"use client"
import { api } from "~/trpc/react";

export default function GetBoard() {

  const {data, isFetching, error, status} = api.bingoBoard.getRandomSquares.useQuery(undefined, {
    refetchInterval: 10000
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
      <div className="flex flex-col items-center justify-items-center gap-4 md:gap-8">
        <div className="grid grid-cols-5 gap-4 w-full grid-rows-5">
          {
            data.map((item, index) => {
              const statusBackgroundClass = item.isActive ? "bg-green-500" : "bg-gray-200";
              const statusForegroundClass = item.isActive ? "text-white" : "text-gray-700";
              return (
              <div key={index} className={`relative group flex rounded-lg p-4 place-content-evenly ${statusBackgroundClass}`}>
                <span className={`${statusForegroundClass} font-bold text-center`}>{item.content}</span>
              </div>
            )})
          }
        </div>
      </div>
    </div>
  </section>);
}

