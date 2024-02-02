'use client'

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../../_components/ui/button";

export type Game = {
  password: boolean;
  sportEvents: string;
  name: string;
  description: string | null;
  id: number;
  active: boolean;
  owner: {
      name: string | null;
      id: string;
  };
  _count: {
      owner: number;
      players: number;
      sportEvents: number;
      playerSquares: number;
      categories: number;
  };
};

export const columns:  ColumnDef<Game>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
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
    accessorKey: "owner.name",
    header: "Owner",
  },
  {
    accessorKey: "_count.players",
    header: "Players",
  },
  {
    accessorKey: "sportEvents",
    header: "Sport Events",
  },
  {
    accessorKey: "active",
    header: "Active",
  }
]