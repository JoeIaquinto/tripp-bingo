"use client"
import { api } from "~/trpc/react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../_components/ui/hover-card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "~/app/_components/ui/alert-dialog";
import { RefreshCw, RefreshCwOff } from "lucide-react";
import { Button } from "~/app/_components/ui/button";

export default function GetBoard({id}: {id: number}) {
  const {data, isFetching, error, refetch} = api.game.getGame.useQuery( { id }, {
    refetchInterval: 15000,
    refetchOnMount: false,
  });
  const rerollMutation = api.game.reRollSquare.useMutation({
    onSettled: async () => {
      await refetch();
    }
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
  const orderedSquares = data.myBoard.flatMap(x => {
    return x.squares.sort((a,b) => {
      const aCat = data.game.categories.find(x => x.id === a.categoryId)!;
      const bCat = data.game.categories.find(x => x.id === b.categoryId)!;
      const aScore = (aCat.categoryIndex + 1) * 10 + (a.squareIndex + 1);
      const bScore = (bCat.categoryIndex + 1) * 10 + (b.squareIndex + 1);
      return aScore - bScore;
    });
  })

  return (
  <section className="min-w-fit mt-4 h-1/2">
    <div className="container px-4 md:px-6">
      <div className="grid grid-flow-row grid-cols-5 justify-items-center items-center pb-4">
        {
          data.game.categories.map((category) => {
            return (
              <div key={category.name} className="flex flex-grow items-center justify-items-center">
                {category.description ? 
                <HoverCard>
                  <HoverCardTrigger className="items-center flex">
                    <span className="text-md font-bold md:text-lg text-center">{category.name}</span>
                  </HoverCardTrigger>
                  <HoverCardContent className="items-center flex">
                    <span className="text-xs md:text-sm text-center">{category.description}</span>
                  </HoverCardContent>
                </HoverCard> : 
                <span className="text-md font-bold md:text-lg text-center">{category.name}</span>
                }
              </div>
            )
          })
        }
      </div>
      <div className="grid grid-flow-col grid-cols-5 grid-rows-5 justify-center justify-items-center items-center gap-4">
        {
          orderedSquares.map((item) => {
            const statusBackgroundClass = item.square.hasOccured ? "bg-green-500" : "bg-primary-foreground";
            const statusForegroundClass = item.square.hasOccured  ? "text-white" : "text-foreground";
            return (
            <div key={`${item.categoryId}-${item.squareIndex}`} className="relative group flex flex-col h-full w-full">
              <div className="absolute bg-primary-foreground z-10 top-0 right-0">
                <AlertDialog>
                  <AlertDialogTrigger disabled={!data.myBoard[0]!.rerollsLeft}>
                    <Button variant="outline" size="xs">
                      { data.myBoard[0]!.rerollsLeft > 0 ? <RefreshCw className="h-4 w-4" /> : <RefreshCwOff  className="h-4 w-4 text-muted-foreground" /> }
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Reroll Square?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to reroll &apos;{item.square.description}&apos;? You have {data.myBoard[0]?.rerollsLeft} rerolls remaining.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => {
                        rerollMutation.mutate({
                          gameId: id,
                          categoryId: item.categoryId,
                          squareIndex: item.squareIndex
                        })
                        }}>Yes</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className={`relative group flex flex-col flex-grow h-full rounded-lg p-0 sm:p-1 md:p-4 text-xs md:text-md lg:text-lg place-content-evenly ${statusBackgroundClass} text-center text-wrap whitespace-break-spaces text-xs pt-6`}>
                <div className="flex flex-col">
                  <span className={`${statusForegroundClass} font-bold text-center`}>{item.square.description}</span>
                  <span className={`${statusForegroundClass} text-center text-xs`}>Current: {item.square.currentValue}</span>
                </div>
              </div>
            </div>
            )
          })
        }

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

