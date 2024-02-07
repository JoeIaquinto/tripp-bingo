"use client"

import { CheckSquare2, Square } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import { Card, CardContent } from "~/app/_components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "~/app/_components/ui/carousel";
import { api } from "~/trpc/react";

export default function PatternOverview({id}: {id: number}) {
  const {data, isFetching, error } = api.game.getGame.useQuery( { id });

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
    <div className="flex flex-row place-items-start justify-items-start gap-8 max-w-min pl-16">
      {
        data.game.bingoPatterns.map(pattern => {
          return (
            <div key={pattern.name} className="container flex flex-col rounded-sm border p-4 px-16 items-center">
              <h2 className="font-bold">{pattern.name}</h2>
              <Carousel
                opts={{
                  align: "start",
                }}
                plugins={[
                  Autoplay({
                    delay: 2000,
                  })
                ]}
                className="max-w-44 min-w-44"
              >
                <CarouselContent>
                  {pattern.lines.flatMap((p, index) => (
                    <CarouselItem key={index} className="basis-full">
                      <div className="p-2">
                        <Card>
                          <CardContent className="flex flex-row p-2 place-content-center">
                            {
                              [0, 1, 2, 3, 4].map(i => (
                                <div key={i} className="flex flex-col gap-2">
                                  {
                                    [0, 1, 2, 3, 4].map(j => (
                                      <div key={j}>
                                        {p.indexPattern.find(x => x.x === i && x.y === j) ? <CheckSquare2 className="text-green-500" /> : <Square className="text-muted-foreground" />}
                                      </div>))
                                  }
                                </div>
                              ))
                            }
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          );
        })
      }
    </div>
  )
}