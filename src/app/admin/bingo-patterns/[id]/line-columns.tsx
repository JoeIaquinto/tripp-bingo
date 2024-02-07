'use client'

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CheckSquare2, Square } from "lucide-react";
import { Button } from "../../../_components/ui/button";

export type BingoPattern = {
  id: number;
  indexPattern: {
    x: number;
    y: number;
  }[];
};

export const columns:  ColumnDef<BingoPattern>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Id
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "indexPattern",
    header: "Index Pattern",
    cell: ({ row }) => {

      return (
        
        <div className="flex flex-row gap-4">
        {
          [0, 1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col gap-2">
              {
                [0, 1, 2, 3, 4].map(j => (
                  <div key={j}>
                    {row.original.indexPattern.find(x => x.x === i && x.y === j) ? <CheckSquare2 /> : <Square />}
                  </div>))
              }
            </div>
          ))
        }
        </div>
      )
    },
  },
]