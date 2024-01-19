"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../_components/ui/button";
import { Input } from "../../_components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../../_components/ui/form";
import { deleteGame } from "./actions";

const FormSchema = z.object({
  id: z.string().min(1)
});

export default function DeleteGameForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  async function onSubmit(data: {id: string}) {
    const id = parseInt(data.id);
    await deleteGame(id);

    form.reset();
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-1/6- space-y-6 mt-4">
        <div className="flex flex-row items-center justify-end rounded-lg border p-4 gap-4">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem  className="flex flex-grow">
                  <FormControl>
                    <Input type="number" placeholder="Delete Bingo Game Id" {...field}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          <Button variant="destructive" type="submit">Delete</Button>
        </div>
      </form>
    </Form>
  )
}