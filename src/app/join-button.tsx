"use client"

import { api } from "~/trpc/react"
import { Button } from "./_components/ui/button"
import { useRouter } from "next/navigation";

export default function JoinButton({ gameId } : { gameId: number }) {

  const router = useRouter()
  const joinGameMutation = api.game.joinGame.useMutation();
  function joinGame(gameId: number) {
    joinGameMutation.mutate({ id: gameId });
    router.push(`/game/${gameId}`);
  }
  return (
    <Button onClick={() => joinGame(gameId)}>Join</Button>
  )

}