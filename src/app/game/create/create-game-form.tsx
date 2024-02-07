"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../_components/ui/button";
import { Input } from "../../_components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../_components/ui/form";
import { createGame } from "./actions";
import { type GameInfo } from "~/lib/nhl-api/get-games";
import MultipleSelector, { type Option } from "../../_components/ui/multiple-selector";

const FormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  description: z.string().optional(),
  categories: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).min(5, {
    message: "5 categories are required",
  }).max(5, {
    message: "5 categories are required",
  }),
  sportEvents: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).min(1, {
    message: "At least 1 sport event is required",
  }),
  password: z.string().optional(),
  bingoPatterns: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
});

export interface CategoryInfo {
  id: string;
  name: string;
  description: string | null;
}

export default function CreateGameForm(data: {games: GameInfo[], categories: CategoryInfo[], bingoPatterns: Option[]}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      description: undefined,
      categories: [],
      sportEvents: [],
      password: undefined,
      bingoPatterns: undefined,
    },
  });

  async function onSubmit(data: {
    name: string;
    description?: string | undefined;
    categories: Option[];
    sportEvents: Option[];
    password?: string | undefined;
    bingoPatterns?: Option[] | undefined;
}) {    
    await createGame(data);

    form.reset();
  }
  
  return (
    <section className="win-w-fit mt-4 h-1/2">
    <div className="container px-4 md:px-6">
      <div className="flex flex-col items-center justify-items-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3">
          <div className="flex flex-col justify-end rounded-lg border p-4 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex flex-grow flex-col items-baseline gap-1">
                    <FormLabel className="text-muted-foreground">Name</FormLabel>
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
                  <FormItem className="flex flex-grow flex-col items-baseline gap-1">
                    <FormLabel className="text-muted-foreground">Description</FormLabel>
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
                  <FormItem className="flex flex-grow flex-col items-baseline gap-1">
                    <FormLabel className="text-muted-foreground">Password (Optional)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="(Optional) Add a password" {...field}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sportEvents"
                render={({ field }) => (
                  <FormItem className="flex flex-grow flex-col items-baseline gap-1">
                    <FormLabel className="text-muted-foreground">Games</FormLabel>
                    <MultipleSelector onChange={field.onChange} options={
                      data.games.map((game) => {
                        return {
                          label: game.gameName,
                          value: game.id
                        }
                      })
                    }
                    hidePlaceholderWhenSelected={true} 
                    placeholder="Select the games to add to your bingo board..." />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem className="flex flex-grow flex-col items-baseline gap-1">
                    <FormLabel className="text-muted-foreground">Categories</FormLabel>
                    <MultipleSelector onChange={field.onChange} options={
                      data.categories.map((category) => {
                        return {
                          label: category.description ? `${category.name} - ${category.description}` : category.name,
                          value: category.id
                        }
                      })
                    } 
                     placeholder="Select the categories to add to your bingo board..."
                     maxSelected={5}
                     hidePlaceholderWhenSelected={true} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bingoPatterns"
                render={({ field }) => (
                  <FormItem className="flex flex-grow flex-col items-baseline gap-1">
                    <FormLabel className="text-muted-foreground">Categories</FormLabel>
                    <MultipleSelector onChange={field.onChange} options={
                      data.bingoPatterns
                    } 
                     placeholder="Select the patterns to match..."
                     maxSelected={5}
                     hidePlaceholderWhenSelected={true} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Form>
      </div>
      </div>
    </section>
  )
}