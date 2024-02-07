"use client"

import { api } from "~/trpc/react"
import { Button } from "./_components/ui/button"
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./_components/ui/alert-dialog";
import { Lock } from "lucide-react";
import { Input } from "./_components/ui/input";
import { useState } from "react";

export default function JoinButton({ gameId } : { gameId: number }) {

  const router = useRouter()
  const [password, setPassword] = useState<string>("");
  const { data, isLoading, error } = api.game.gameHasPassword.useQuery({ gameId });
  const joinGameMutation = api.game.joinGame.useMutation();
  function joinGame(gameId: number, password?: string | undefined) {
    joinGameMutation.mutate({ gameId, password });
    router.push(`/game/${gameId}`);
  }
  if (isLoading) return null;
  if (error) return null;

  if (data) {
    return (
      <AlertDialog>
        <AlertDialogTrigger>
          <Button variant="outline" size="xs">
            Join <Lock />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Password Protected
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div>
                <span>This game is password protected. Please enter the password to join.</span>
                <Input type="password" onChange={(e) => {
                  setPassword(e.target.value);
                }} />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                joinGame(gameId, password);
              }}>Join</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  } else {
    return (
      <Button onClick={() => joinGame(gameId)}>Join</Button>
    )
  }

}