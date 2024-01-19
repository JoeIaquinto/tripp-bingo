"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../_components/ui/button";
import { Input } from "../../_components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../../_components/ui/form";
import { createGame } from "./actions";

const FormSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
});

export default function CreateGameForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
    },
  });

  async function onSubmit(data: {title: string}) {
    const content = data.title;
    
    await createGame(content);

    form.reset();
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-1/2 space-y-6 mt-4">
        <div className="flex flex-row items-center justify-end rounded-lg border p-4 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem  className="flex flex-grow">
                  <FormControl>
                    <Input placeholder="New Bingo Game Title" {...field}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          <Button type="submit">Submit</Button>
        </div>
      </form>
    </Form>
  )
}