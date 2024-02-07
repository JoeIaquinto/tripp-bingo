"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../_components/ui/button";
import { Input } from "../../_components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../../_components/ui/form";
import { createPattern } from "./actions";

const FormSchema = z.object({
  name: z.string().min(1),
  description: z.string()
});

export default function CreatePatternForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      description: undefined,
    },
  });

  async function onSubmit(data: {name: string, description: string}
  ) {
    
    await createPattern({ ...data });

    form.reset();
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-1/2 space-y-6 mt-4">
        <div className="flex flex-row items-center justify-end rounded-lg border p-4 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem  className="flex flex-grow">
                  <FormControl>
                    <Input placeholder="New Bingo Pattern Name" {...field}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem  className="flex flex-grow">
                  <FormControl>
                    <Input placeholder="A short description" {...field}/>
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