"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../_components/ui/button";
import { Input } from "../../_components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../../_components/ui/form";
import { createSquare } from "./actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/app/_components/ui/select";
import { type HockeyStat } from "~/lib/square-engine/square-interpreter";
/*
  description: string;
  baseGameCategoryId: string;
  skaterType: "F" | "D" | "G" | "Team" | "N/A";
  stat: string;
  rangeMin: number;
  rangeMax: number;
  displayFormat: string;
*/

const statOptions = [
  { value: 'won-faceoff', label: 'Won Faceoff' },
  { value: 'won-offensive-zone-faceoff', label: 'Won Offensive Zone Faceoff' },
  { value: 'won-defensive-zone-faceoff', label: 'Won Defensive Zone Faceoff' },
  { value: 'hit', label: 'Hit' },
  { value: 'hittee', label: 'Hittee' },
  { value: 'puck-out-of-play', label: 'Puck Out of Play' },
  { value: 'icing', label: 'Icing' },
  { value: 'offside', label: 'Offside' },
  { value: 'blocked-shot', label: 'Blocked Shot' },
  { value: 'shot-blocked', label: 'Shot Blocked' },
  { value: 'pk-block', label: 'PK Block' },
  { value: 'penalty', label: 'Penalty' },
  { value: 'stick-infraction', label: 'Stick Infraction' },
  { value: 'pim', label: 'PIM' },
  { value: 'major-penalty', label: 'Major Penalty' },
  { value: 'penalty-drawn', label: 'Penalty Drawn' },
  { value: 'giveaway', label: 'Giveaway' },
  { value: 'defensive-zone-giveaway', label: 'Defensive Zone Giveaway' },
  { value: 'offensive-zone-giveaway', label: 'Offensive Zone Giveaway' },
  { value: 'takeaway', label: 'Takeaway' },
  { value: 'defensive-zone-takeaway', label: 'Defensive Zone Takeaway' },
  { value: 'offensive-zone-takeaway', label: 'Offensive Zone Takeaway' },
  { value: 'shot-on-goal', label: 'Shot on Goal' },
  { value: 'shot-from-defensive-zone', label: 'Shot from Defensive Zone' },
  { value: 'shot-wrist', label: 'Wrist Shot' },
  { value: 'shot-tip', label: 'Tip Shot' },
  { value: 'shot-snap', label: 'Snap Shot' },
  { value: 'shot-slap', label: 'Slap Shot' },
  { value: 'shot-backhand', label: 'Backhand Shot' },
  { value: 'post', label: 'Post' },
  { value: 'goal', label: 'Goal' },
  { value: 'point', label: 'Point' },
  { value: 'power-play-goal', label: 'Power Play Goal' },
  { value: 'short-handed-goal', label: 'Short Handed Goal' },
];

const skaterTypeOptions = [
  { value: 'F', label: 'Forward' },
  { value: 'D', label: 'Defense' },
  { value: 'G', label: 'Goalie' },
  { value: 'Team', label: 'Team' },
  { value: 'N/A', label: 'N/A' },
];

const FormSchema = z.object({
  description: z.string().min(1),
  baseGameCategoryId: z.string().min(1),
  skaterType: z.enum(["F", "D", "G", "Team", "N/A"]),
  stat: z.enum([
    'won-faceoff', 'won-offensive-zone-faceoff', 'won-defensive-zone-faceoff',
    'hit', 'hittee',
    'puck-out-of-play', 'icing', 'offside',
    'blocked-shot', 'shot-blocked', 'pk-block',
    'penalty', 'stick-infraction', 'pim', 'major-penalty', 'penalty-drawn',
    'giveaway', 'defensive-zone-giveaway', 'offensive-zone-giveaway',
    'takeaway', 'defensive-zone-takeaway', 'offensive-zone-takeaway',
    'shot-on-goal', 'shot-from-defensive-zone', 'shot-wrist', 'shot-tip', 'shot-snap', 'shot-slap', 'shot-backhand',
    'post',
    'goal', 'point', 'power-play-goal', 'short-handed-goal'
  ]),
  rangeMin: z.string().min(0),
  rangeMax: z.string().min(0),
  displayFormat: z.string().min(1),
});

export default function CreateSquareForm({categoryOptions} : {categoryOptions: {value: string, label: string}[]}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: "",
      baseGameCategoryId: "",
      skaterType: "F",
      stat: "won-faceoff",
      rangeMin: '0',
      rangeMax: '0',
      displayFormat: "{player} {stat} over {value}",
    },
  });

  async function onSubmit(data: {
    description: string;
    baseGameCategoryId: string;
    skaterType: "F" | "D" | "G" | "Team" | "N/A";
    stat: HockeyStat;
    rangeMin: string;
    rangeMax: string;
    displayFormat: string;
  }) {
    const fixed = {
      ...data,
      rangeMin: parseInt(data.rangeMin),
      rangeMax: parseInt(data.rangeMax),
    }
    await createSquare(fixed);

    form.reset();
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="">
        <div className="flex flex-row items-center justify-end rounded-lg border p-4 gap-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem  className="flex flex-grow">
                  <FormControl>
                    <Input placeholder="Internal description" {...field}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayFormat"
              render={({ field }) => (
                <FormItem  className="flex flex-grow">
                  <FormControl>
                    <Input placeholder="Internal description" {...field}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="baseGameCategoryId"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.map(option => {
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="skaterType"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Skater/Team Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {skaterTypeOptions.map(option => {
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stat"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Stat Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statOptions.map(option => {
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rangeMin"
              render={({ field }) => (
                <FormItem  className="flex flex-grow">
                  <FormControl>
                    <Input placeholder="Minimum random value" type="number" {...field}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rangeMax"
              render={({ field }) => (
                <FormItem  className="flex flex-grow">
                  <FormControl>
                    <Input placeholder="Maximum random value" type="number" {...field}/>
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