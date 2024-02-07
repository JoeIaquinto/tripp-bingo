'use client'

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../../_components/ui/button";

export type Category = {
  name: string;
  description: string | null;
  id: string;
  _count: {
      squares: number;
      categories: number;
  };
  gameType: string;
}

export const columns: ColumnDef<Category>[] = [
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
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "_count.squares",
    header: "Squares",
  },
  {
    accessorKey: "id",
    header: "Id",
  },
  {
    accessorKey: "gameType",
    header: "Game Type",
  },
];