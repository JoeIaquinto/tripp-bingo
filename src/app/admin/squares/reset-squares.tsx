'use client'

import { startTransition } from "react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction, AlertDialogHeader, AlertDialogFooter } from "../../_components/ui/alert-dialog";
import { resetSquareStates } from "./actions";

export default function ResetSquaresDialog() {
  return (
    <AlertDialog>
      <AlertDialogTrigger className="border p-4 rounded-lg">Reset All Squares</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will reset all squares to inactive. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            startTransition(() => {
              resetSquareStates().catch(console.error);
            })
          }}>Reset All</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}