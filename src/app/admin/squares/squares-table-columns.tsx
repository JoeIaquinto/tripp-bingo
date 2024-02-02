'use client'

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "../../_components/ui/button";

export type Square = {
  id: number;
  description: string;
  baseGameCategory: {
      id: string;
      name: string;
  };
  skaterType: string;
  stat: string;
  rangeMin: number;
  rangeMax: number;
  displayFormat: string;
}

export const columns: ColumnDef<Square>[] = [
  {
    accessorKey: "description",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Description
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "baseGameCategory.name",
    header: "Category",
  },
  {
    accessorKey: "skaterType",
    header: "Skater Type",
  },
  {
    accessorKey: "stat",
    header: "Stat",
  },
  {
    accessorKey: "rangeMin",
    header: "Range Min",
  },
  {
    accessorKey: "rangeMax",
    header: "Range Max",
  },
  {
    accessorKey: "displayFormat",
    header: "Display Format",
  },
  {
    accessorKey: "id",
    header: "Id",
  },
];