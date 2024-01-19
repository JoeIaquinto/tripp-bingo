"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/trpc/react";
import { Button } from "../../_components/ui/button";
import { Input } from "../../_components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../../_components/ui/form";
import { createSquare } from "./actions";

const FormSchema = z.object({
  content: z.string().min(1, {
    message: "Content is required",
  }),
});

export default function CreateSquareForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      content: "",
    },
  });

  async function onSubmit(data: {content: string}) {
    const content = data.content;
    
    await createSquare(content);

    form.reset();
  }
  
  return (
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
  )
}