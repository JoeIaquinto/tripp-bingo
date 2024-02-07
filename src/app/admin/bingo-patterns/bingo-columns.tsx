'use client'

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../../_components/ui/button";
import Link from "next/link";

export type BingoPattern = {
  name: string;
  description: string | null;
  id: number;
  _count: {
      lines: number;
      games: number;
  };
};

export const columns:  ColumnDef<BingoPattern>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "id",
    header: "Id",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "_count.lines",
    header: "Lines in Pattern",
  },
  {
    accessorKey: "_count.games",
    header: "Games W/ Pattern",
  },
  {
    accessorKey: "id",
    header: "Actions",
    cell: ({ row }) => {
      return (
        <div className="flex flex-row gap-4">
          <Link href={`/admin/bingo-patterns/${row.original.id}`}>View Patterns</Link>
        </div>
      )
    },
  }
]