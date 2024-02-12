"use client"

import { api } from "~/trpc/react"
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./_components/ui/alert-dialog";
import { useState } from "react";
import { Input } from "./_components/ui/input";

export default function JoinButtonGuest({ gameId } : { gameId: number }) {

  const router = useRouter()
  const [name, setName] = useState('My Name');
  const joinGameMutation = api.game.joinGuest.useMutation();
  function joinGame(gameId: number, name: string) {
    joinGameMutation.mutate({ id: gameId, name });
    router.push(`/game/${gameId}/${name}`);
  }
  return (
    <AlertDialog>
    <AlertDialogTrigger className="border p-4 rounded-lg">Join As Guest</AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Enter your name</AlertDialogTitle>
        <AlertDialogDescription>
          <div>
            <Input onChange={(e) => {
              setName(e.target.value);
            }} />
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={() => {
          joinGame(gameId, name);
        }}>Join</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  )

}