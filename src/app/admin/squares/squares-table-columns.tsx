'use client'

import { ColumnDef } from "@tanstack/react-table";
import { Square, ArrowUpDown } from "lucide-react";
import { Button } from "../../_components/ui/button";
import { Switch } from "../../_components/ui/switch";
import { activateSquare, deactivateSquare } from "./actions";

export type Square = {
  id: number;
  content: string;
  isActive: boolean;
}

export const columns: ColumnDef<Square>[] = [
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
  },
  {
    accessorKey: "isActive",
    header: "Is Active",
    cell: ({ row }) => {
      return (
        <Switch defaultChecked={row.original.isActive} onCheckedChange={async (e) => {
          if (e.valueOf()) {
            activateSquare(row.original.id)
          } else {
            deactivateSquare(row.original.id)
          }
        }} />
      );
    }
  },
];