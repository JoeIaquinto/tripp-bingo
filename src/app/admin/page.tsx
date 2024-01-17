"use client"

import { SessionProvider, useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { Button } from "../_components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../_components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../_components/ui/alert-dialog";
import { Input } from "../_components/ui/input";;
import { Switch } from "../_components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage } from "../_components/ui/form";
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "../_components/ui/data-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

type Square = {
  id: number;
  content: string;
  isActive: boolean;
}

const FormSchema = z.object({
  content: z.string().min(1, {
    message: "Content is required",
  }),
})

export default function Admin() {
  return (
    <main className="">
      <div className="flex flex-row items-center">
        <h1 className="flex-grow text-4xl font-bold text-center">Tripp Tracy Bingo</h1>
      </div>
      <SessionProvider>
        <AdminList />
      </SessionProvider>
    </main>
  )
}

function AdminList() {
  const { data: session } = useSession()
  const squares = api.bingoBoard.list.useQuery().data ?? [];
  let bingoState = api.bingoState.getBingoState.useQuery().data ?? {
    id: 0,
    isActive: false,
    squares: [],
  };

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      content: "",
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    create(data);
  }

  const { mutate: create } = api.bingoBoard.createSquare.useMutation({
    onSuccess: async (data) => {
      squares.push(data);
    }
  });

  const { mutate: activate } = api.bingoBoard.activateSquare.useMutation({
    onSuccess: async (data) => {
      const square = squares.find((square) => square.id === data.id)!
      square.isActive = true;
    }
  });
  const { mutate: deactivate } = api.bingoBoard.deactivateSquare.useMutation({
    onSuccess: async (data) => {
      const square = squares.find((square) => square.id === data.id)!
      square.isActive = false;
    }
  });
  const { mutate: update } = api.bingoBoard.updateSquare.useMutation({
    onSuccess: async (data) => {
      const square = squares.find((square) => square.id === data.id)!
      square.content = data.content;
    }
  });
  const { mutate: resetBingoState } = api.bingoState.resetBingoState.useMutation({
    onSuccess: async (data) => {
      bingoState = data;
    }
  });

  function resetAll() {
    squares.forEach((square) => {
      deactivate(square.id);
    });
  }

  const columns: ColumnDef<Square>[] = [
    {
      accessorKey: "content",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Content
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const square = row.original;
        return (
          <div className="flex w-full items-center space-x-2">
            <Input type="text" placeholder="Content" defaultValue={square.content} onChange={(e) => {
              squares.find((square) => square.id === row.original.id)!.content = e.target.value;
            }} />
            <Button type="submit" onClick={() => {
              update({ id: square.id, content: square.content, isActive: square.isActive });
            }}>Update</Button>
          </div>
        );
      }
    },
    {
      accessorKey: "isActive",
      header: "Is Active",
      cell: ({ row }) => {
        return (
          <Switch defaultChecked={row.original.isActive} onCheckedChange={(e) => {
            squares.find((square) => square.id === row.original.id)!.isActive = e.valueOf();
            if (e.valueOf()) {
              activate(row.original.id);
            } else {
              deactivate(row.original.id);
            }
          }} />
        );
      }
    },
  ];

  if (!session?.user) return null;
  if (session?.user?.role !== "admin") return null;

  return (
    <div className="space-y-6 gap-4 ml-4 mb-4">
      <div className="flex flex-row gap-4 items-baseline ml-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-1/2 space-y-6 mt-4">
            <div className="flex flex-row items-center justify-end rounded-lg border p-4 gap-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem  className="flex flex-grow">
                      <FormControl>
                        <Input placeholder="New Bingo Square Content" {...field}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
        <AlertDialog>
          <AlertDialogTrigger className="border p-4 rounded-lg">Reset All Squares?</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset all squares to inactive. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => resetAll()}>Reset All</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog>
          <AlertDialogTrigger className="border p-4 rounded-lg">Reset Bingo State?</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset the bingo winner. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => resetBingoState()}>Reset Bingo State</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <DataTable columns={columns} data={squares} />
    </div>
  );
}
