
import { type PrismaClient, type Prisma } from "@prisma/client";
import { db } from "~/server/db";
import { type HockeyStat } from "../square-engine/square-interpreter";

const categories = await db.baseGameCategory.findMany({
  select: {
    id: true,
    name: true,
  }
});

type CategoryName = "Grit" | "200 Foot Game" | "Getting Pucks Deep" | "Battle in the Trenches" | "Hockey IQ" | "Heart and Hustle" | "Net-front Presence" | "Cycle Game" | "Clutch Performances";
type SkaterType = "F" | "D" | "Team" | "N/A";
function getCategoryId(categoryName: CategoryName) {
  const category = categories.find(x => x.name === categoryName);
  if (!category) {
    throw new Error(`Category ${categoryName} not found`);
  }
  return category.id;
}

interface SeededSquare {
  category: CategoryName;
  skaterType: SkaterType;
  stat: HockeyStat;
  rangeMin: number;
  rangeMax: number;
}

const hockeyStatToFriendlyName: Record<HockeyStat, string> = {
  'won-faceoff': 'faceoffs won',
  'won-offensive-zone-faceoff': 'offensive zone faceoffs won',
  'won-defensive-zone-faceoff': 'defensive zone faceoffs won',
  'hit': 'hits',
  'hittee': 'hits taken',
  'puck-out-of-play': 'pucks out of play',
  'icing': 'icings',
  'offside': 'offsides',
  'blocked-shot': 'shot blocks',
  'shot-blocked': 'shots blocked',
  'pk-block': 'shot blocks on the penalty kill',
  'penalty': 'penalties',
  'stick-infraction': 'stick infractions',
  'pim': 'penalty minutes',
  'major-penalty': 'major penalties',
  'penalty-drawn': 'penalties drawn',
  'giveaway': 'giveaways',
  'defensive-zone-giveaway': 'defensive zone giveaways',
  'offensive-zone-giveaway': 'offensive zone giveaways',
  'takeaway': 'takeaways',
  'defensive-zone-takeaway': 'defensive zone takeaways',
  'offensive-zone-takeaway': 'offensive zone takeaways',
  'shot-on-goal': 'shots',
  'shot-from-defensive-zone': 'shots from the defensive zone',
  'shot-wrist': 'wrist shots',
  'shot-tip': 'tipped shots',
  'shot-snap': 'snap shots',
  'shot-slap': 'slap shots',
  'shot-backhand': 'backhand shots',
  'post': 'posts hit',
  'goal': 'goals',
  'point': 'points',
  'power-play-goal': 'power play goals',
  'short-handed-goal': 'short handed goals',
}

function generateDisplayFormat(stat: HockeyStat, skaterType: SkaterType) {
  const subject = skaterType === "N/A" ? "{game}" : skaterType === "Team" ? "{team}" : "{player}";
  const statDisplay = hockeyStatToFriendlyName[stat];
  return `${subject} over {value} ${statDisplay}`;
}

function generateDescription(stat: HockeyStat, skaterType: SkaterType) {
  const subject = skaterType === "N/A" ? "the game" : skaterType === "Team" ? "the team" : skaterType === "F" ? "a forward" : "a defenseman";
  const statDisplay = hockeyStatToFriendlyName[stat];
  return `${statDisplay} by ${subject}`;
}

const seededSquares: SeededSquare[] = [
  {
    category: "Grit",
    skaterType: "D",
    stat: "hit",
    rangeMin: 2,
    rangeMax: 5,
  },
  {
    category: "Grit",
    skaterType: "F",
    stat: "won-offensive-zone-faceoff",
    rangeMin: 2,
    rangeMax: 5,
  },
  {
    category: "Grit",
    skaterType: "Team",
    stat: "penalty-drawn",
    rangeMin: 2,
    rangeMax: 4,
  },
  {
    category: "Grit",
    skaterType: "Team",
    stat: "hittee",
    rangeMin: 10,
    rangeMax: 17,
  },
  {
    category: "Grit",
    stat: "defensive-zone-takeaway",
    skaterType: "Team",
    rangeMin: 5,
    rangeMax: 8,
  },
  {
    category: "200 Foot Game",
    skaterType: "D",
    stat: "shot-blocked",
    rangeMin: 2,
    rangeMax: 5,
  },
  {
    category: "200 Foot Game",
    skaterType: "F",
    stat: "shot-on-goal",
    rangeMin: 2,
    rangeMax: 6,
  },
  {
    category: "200 Foot Game",
    skaterType: "Team",
    stat: "shot-from-defensive-zone",
    rangeMin: 2,
    rangeMax: 3,
  },
  {
    category: "200 Foot Game",
    skaterType: "Team",
    stat: "won-defensive-zone-faceoff",
    rangeMin: 15,
    rangeMax: 20,
  },
  {
    category: "200 Foot Game",
    skaterType: "Team",
    stat: "won-offensive-zone-faceoff",
    rangeMin: 15,
    rangeMax: 20,
  },
  {
    category: "200 Foot Game",
    skaterType: "Team",
    stat:"offensive-zone-takeaway",
    rangeMin: 5,
    rangeMax: 8,
  },
  {
    category: "200 Foot Game",
    skaterType: "D",
    stat: "shot-blocked",
    rangeMin: 2,
    rangeMax: 5,
  },
  {
    category: "Getting Pucks Deep",
    skaterType: "F",
    stat: "shot-on-goal",
    rangeMin: 2,
    rangeMax: 6,
  },
  {
    category: "Getting Pucks Deep",
    skaterType: "F",
    stat: "shot-slap",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Getting Pucks Deep",
    skaterType: "F",
    stat: "shot-tip",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Getting Pucks Deep",
    skaterType: "F",
    stat: "shot-wrist",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Getting Pucks Deep",
    skaterType: "F",
    stat: "shot-backhand",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Getting Pucks Deep",
    skaterType: "Team",
    stat: "shot-from-defensive-zone",
    rangeMin: 2,
    rangeMax: 3,
  },
  {
    category: "Getting Pucks Deep",
    skaterType: "Team",
    stat: "shot-on-goal",
    rangeMin: 15,
    rangeMax: 20,
  },
  {
    category: "Battle in the Trenches",
    skaterType: "F",
    stat: "hit",
    rangeMin: 2,
    rangeMax: 5,
  },
  {
    category: "Battle in the Trenches",
    skaterType: "D",
    stat: "hit",
    rangeMin: 2,
    rangeMax: 5,
  },
  {
    category: "Battle in the Trenches",
    skaterType: "Team",
    stat: "hittee",
    rangeMin: 10,
    rangeMax: 17,
  },
  {
    category: "Battle in the Trenches",
    skaterType: "Team",
    stat: "penalty-drawn",
    rangeMin: 2,
    rangeMax: 4,
  },
  {
    category: "Battle in the Trenches",
    skaterType: "Team",
    stat: "hittee",
    rangeMin: 10,
    rangeMax: 17,
  },
  {
    category: "Battle in the Trenches",
    skaterType: "Team",
    stat: "hit",
    rangeMin: 10,
    rangeMax: 17,
  },
  {
    category: "Hockey IQ",
    skaterType: "F",
    stat: "takeaway",
    rangeMin: 2,
    rangeMax: 5,
  },
  {
    category: "Hockey IQ",
    skaterType: "D",
    stat: "takeaway",
    rangeMin: 2,
    rangeMax: 5,
  },
  {
    category: "Hockey IQ",
    skaterType: "Team",
    stat: "takeaway",
    rangeMin: 5,
    rangeMax: 8,
  },
  {
    category: "Hockey IQ",
    skaterType: "F",
    stat: "giveaway",
    rangeMin: 2,
    rangeMax: 5,
  },
  {
    category: "Hockey IQ",
    skaterType: "D",
    stat: "giveaway",
    rangeMin: 2,
    rangeMax: 5,
  },
  {
    category: "Hockey IQ",
    skaterType: "Team",
    stat: "giveaway",
    rangeMin: 5,
    rangeMax: 8,
  },
  {
    category: "Heart and Hustle",
    skaterType: "F",
    stat: "shot-on-goal",
    rangeMin: 2,
    rangeMax: 6,
  },
  {
    category: "Heart and Hustle",
    skaterType: "F",
    stat: "shot-slap",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Heart and Hustle",
    skaterType: "F",
    stat: "shot-tip",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Heart and Hustle",
    skaterType: "F",
    stat: "shot-wrist",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Heart and Hustle",
    skaterType: "F",
    stat: "shot-backhand",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Heart and Hustle",
    skaterType: "Team",
    stat: "shot-from-defensive-zone",
    rangeMin: 2,
    rangeMax: 3,
  },
  {
    category: "Heart and Hustle",
    skaterType: "Team",
    stat: "shot-on-goal",
    rangeMin: 15,
    rangeMax: 20,
  },
  {
    category: "Net-front Presence",
    skaterType: "F",
    stat: "goal",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Net-front Presence",
    skaterType: "F",
    stat: "shot-tip",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Net-front Presence",
    skaterType: "F",
    stat: "shot-slap",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Net-front Presence",
    skaterType: "F",
    stat: "shot-wrist",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Net-front Presence",
    skaterType: "F",
    stat: "shot-backhand",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Net-front Presence",
    skaterType: "Team",
    stat: "goal",
    rangeMin: 2,
    rangeMax: 4,
  },
  {
    category: "Net-front Presence",
    skaterType: "Team",
    stat: "shot-tip",
    rangeMin: 2,
    rangeMax: 4,
  },
  {
    category: "Net-front Presence",
    skaterType: "Team",
    stat: "shot-slap",
    rangeMin: 2,
    rangeMax: 4,
  },
  {
    category: "Net-front Presence",
    skaterType: "Team",
    stat: "shot-wrist",
    rangeMin: 2,
    rangeMax: 4,
  },
  {
    category: "Net-front Presence",
    skaterType: "Team",
    stat: "shot-backhand",
    rangeMin: 2,
    rangeMax: 4,
  },
  {
    category: "Cycle Game",
    skaterType: "F",
    stat: "shot-on-goal",
    rangeMin: 2,
    rangeMax: 6,
  },
  {
    category: "Cycle Game",
    skaterType: "F",
    stat: "shot-slap",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Cycle Game",
    skaterType: "F",
    stat: "shot-tip",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Cycle Game",
    skaterType: "F",
    stat: "shot-wrist",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Cycle Game",
    skaterType: "F",
    stat: "shot-backhand",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Cycle Game",
    skaterType: "Team",
    stat: "shot-from-defensive-zone",
    rangeMin: 2,
    rangeMax: 3,
  },
  {
    category: "Cycle Game",
    skaterType: "Team",
    stat: "shot-on-goal",
    rangeMin: 20,
    rangeMax: 30,
  },
  {
    category: "Clutch Performances",
    skaterType: "F",
    stat: "goal",
    rangeMin: 0,
    rangeMax: 0,
  },
  {
    category: "Clutch Performances",
    skaterType: "F",
    stat: "shot-tip",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Clutch Performances",
    skaterType: "F",
    stat: "shot-slap",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Clutch Performances",
    skaterType: "F",
    stat: "shot-wrist",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Clutch Performances",
    skaterType: "F",
    stat: "shot-backhand",
    rangeMin: 1,
    rangeMax: 2,
  },
  {
    category: "Clutch Performances",
    skaterType: "Team",
    stat: "goal",
    rangeMin: 2,
    rangeMax: 4,
  },
  {
    category: "Clutch Performances",
    skaterType: "Team",
    stat: "shot-tip",
    rangeMin: 2,
    rangeMax: 4,
  },
  {
    category: "Clutch Performances",
    skaterType: "Team",
    stat: "shot-slap",
    rangeMin: 2,
    rangeMax: 4,
  },
  {
    category: "Clutch Performances",
    skaterType: "Team",
    stat: "shot-wrist",
    rangeMin: 2,
    rangeMax: 4,
  },
  {
    category: "Clutch Performances",
    skaterType: "Team",
    stat: "shot-backhand",
    rangeMin: 2,
    rangeMax: 4,
  },
  
];

export async function seedSquares(db: PrismaClient) {
  await db.baseGameCategorySquare.createMany({
    data: seededSquares.map(x => {
      const entry: Prisma.BaseGameCategorySquareCreateManyInput = {
          rangeMax: x.rangeMax,
          rangeMin: x.rangeMin,
          stat: x.stat,
          skaterType: x.skaterType,
          baseGameCategoryId: getCategoryId(x.category),
          displayFormat: generateDisplayFormat(x.stat, x.skaterType),
          description: generateDescription(x.stat, x.skaterType),
      };
      return entry;
    }),
    skipDuplicates: true
  })
}
