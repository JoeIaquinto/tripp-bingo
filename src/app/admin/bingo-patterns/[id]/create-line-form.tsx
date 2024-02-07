"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../../_components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../../../_components/ui/form";
import { createBingoPatternLine } from "../actions";
import { Checkbox } from "~/app/_components/ui/checkbox";

interface BingoPatternLine {
  x: number;
  y: number;
}

const FormSchema = z.object({
  checkBoxes: z.array(z.array(z.boolean().default(false))).
    default([
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
      [false, false, false, false, false],
    ]),
});

export default function CreatePatternLineForm({ bingoId }: { bingoId: number }) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {},
  });

  async function onSubmit(data: {
    checkBoxes: boolean[][];
  }) {
    const indexPattern = data.checkBoxes
      .map((row, i) => row.map((cell, j) => cell ? {
        x: i,
        y: j
      }: undefined).filter(x => x !== undefined) as BingoPatternLine[])
      .filter(x => x !== undefined)
      .flat();

    const fixed = {
      bingoId,
      indexPattern: indexPattern
    }
    await createBingoPatternLine(fixed);

    form.reset();
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="">
        <div className="flex flex-row items-center justify-end rounded-lg border p-4 gap-4">
            {
              [0, 1, 2, 3, 4].map(i => (
                <div key={i} className="flex flex-col gap-2">
                  {
                    [0, 1, 2, 3, 4].map(j => (
                      <FormField
                        key={j}
                        control={form.control}
                        name={`checkBoxes.${i}.${j}`}
                        render={({ field }) => (
                          <FormItem  className="flex flex-grow">
                            <FormControl>
                              <Checkbox checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))
                  }
                </div>
              ))
            }

          <Button type="submit">Submit</Button>
        </div>
      </form>
    </Form>
  )
}