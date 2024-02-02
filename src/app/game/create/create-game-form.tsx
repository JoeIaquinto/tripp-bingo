"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../_components/ui/button";
import { Input } from "../../_components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../../_components/ui/form";
import { createGame } from "./actions";
import { type GameInfo } from "~/lib/nhl-api/get-games";
import MultipleSelector from "../../_components/ui/multiple-selector";
/*
{
    name: string;
    description: string | undefined;
    categories: string[];
    sportEvents: string[];
    password: string | undefined;
}
*/
const FormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  description: z.string().optional(),
  categories: z.array(z.string()).min(5, {
    message: "5 categories are required",
  }).max(5, {
    message: "5 categories are required",
  }),
  sportEvents: z.array(z.string()).min(1, {
    message: "At least 1 sport event is required",
  }),
  password: z.string().optional(),
});

export interface CategoryInfo {
  id: string;
  name: string;
  description: string | null;
}

export default function CreateGameForm(data: {games: GameInfo[], categories: CategoryInfo[]}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      description: undefined,
      categories: [],
      sportEvents: [],
      password: undefined,
    },
  });

  async function onSubmit(data: {
    name: string;
    description?: string | undefined;
    categories: string[];
    sportEvents: string[];
    password?: string | undefined;
}) {    
    await createGame(data);

    form.reset();
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-w-full">
        <div className="flex flex-col items-center justify-end rounded-lg border p-4 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-grow">
                  <FormControl>
                    <Input placeholder="Your game's name" {...field}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="flex flex-grow">
                  <FormControl>
                    <Input placeholder="A short description of your game" {...field}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="flex flex-grow">
                  <FormControl>
                    <Input placeholder="(Optional) Add a password" {...field}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sportEvents"
              render={({ field }) => (
                <FormItem className="flex flex-grow">
                  <MultipleSelector onChange={field.onChange} options={
                    data.games.map((game) => {
                      return {
                        label: game.gameName,
                        value: game.id
                      }
                    })
                  } placeholder="Select the games to add to your bingo board..." />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem className="flex flex-grow">
                  <MultipleSelector onChange={field.onChange} options={
                    data.categories.map((category) => {
                      return {
                        label: category.description ? `${category.name} - ${category.description}` : category.name,
                        value: category.id
                      }
                    })
                  } placeholder="Select the categories to add to your bingo board..." />
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