"use client"
import { api } from "~/trpc/react";

export default function GetBoard({id}: {id: number}) {
  const {data, isFetching, error} = api.game.getGame.useQuery( { id }, {
    refetchInterval: 15000,
    refetchOnMount: false,
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
  <section className="min-w-fit mt-4 h-1/2">
    <div className="container px-4 md:px-6">
      <div className="flex flex-col items-center justify-items-center">
        <div className="flex flex-row items-center justify-items-center">
          {
            data.game.categories.map((category) => {
              return (
                <div key={category.categoryIndex} className="flex flex-col items-center justify-items-center">
                  <span className="text-2xl font-bold">{category.name}</span>
                  <span className="text-xs">{category.description}</span>
                  {
                    data.myBoard.flatMap(x => {
                      return x.squares.filter(y => y.categoryId === category.id).sort(x => x.squareIndex);
                    }).map((playerSquare) => {
                      const statusBackgroundClass = playerSquare.square.hasOccured ? "bg-green-500" : "bg-primary-foreground";
                      const statusForegroundClass = playerSquare.square.hasOccured  ? "text-white" : "text-foreground";
                      return (
                      <div key={`${category.categoryIndex}-${playerSquare.squareIndex}`} className={`relative group flex  rounded-lg p-0 sm:p-1 md:p-4 text-xs md:text-md lg:text-lg place-content-evenly ${statusBackgroundClass} text-center text-wrap whitespace-break-spaces text-xs `}>
                        <div className="flex place-items-center">
                          <span className={`${statusForegroundClass} font-bold text-center`}>{playerSquare.square.description} - Current: {playerSquare.square.currentValue}</span>
                        </div>
                      </div>
                    )})
                  }
                </div>
            )})
          }
        </div>
        {/* <div className="grid grid-cols-5 gap-2 md:gap-4 w-full grid-rows-5">
          {
            data.myBoard.map((item, index) => {
              const statusBackgroundClass = item.isActive ? "bg-green-500" : "bg-primary-foreground";
              const statusForegroundClass = item.isActive ? "text-white" : "text-foreground";
              return (
              <div key={index} className={`relative group flex  rounded-lg p-0 sm:p-1 md:p-4 text-xs md:text-md lg:text-lg place-content-evenly ${statusBackgroundClass} text-center text-wrap whitespace-break-spaces text-xs `}>
                <div className="flex place-items-center">
                  <span className={`${statusForegroundClass} font-bold text-center`}>{item.content}</span>
                  {item.inBingo ? <div className="absolute -inset-1 bg-green-800 rounded-lg blur opacity-50 -z-50"></div> : null}
                </div>
              </div>
            )})
          }
        </div> */}
      </div>
    </div>
  </section>);
}

// function RenderBingoWinner({winners} : { winners: string[] }){
//   const winnerNames = winners.join(", ");

//   return (
//     <div>
//       <span>{winnerNames} {winners.length > 1 ? "have won!" : "has won!"}</span>
//     </div>
//   )
// }

