import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
} from "~/server/api/trpc";

export type BingoPatternLine = {
  x: number,
  y: number,
};

export const bingoPatternsRouter = createTRPCRouter({
  createBingoPattern: adminProcedure.input(z.object({
    name: z.string().max(100).min(1),
    description: z.string().max(100),
  })).mutation(async ({ ctx, input }) => {
    const pattern = await ctx.db.bingoPattern.create({
      data: {
        name: input.name,
        description: input.description,
      }
    });
    return pattern;
  }),

  createBingoPatternLine: adminProcedure.input(z.object({
    bingoId: z.number().int(),
    indexPattern: z.array(z.object({
      x: z.number().int().min(0).max(4),
      y: z.number().int().min(0).max(4),
    }))
  }))
  .mutation(async ({ ctx, input }) => {
    const bingoPattern = await ctx.db.bingoPattern.findFirst({ where: { id: input.bingoId } });
    if (!bingoPattern) {
      throw new Error("Pattern not found");
    }

    const line = await ctx.db.bingoPatternLine.create({
      data: {
        indexPattern: JSON.stringify(input.indexPattern),
        bingoId: bingoPattern.id,
      }
    });

    return line;
  }),

  listPatterns: adminProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.bingoPattern.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: true,
      }
    });
    return categories;
  }),

  getLinesForPattern: adminProcedure
  .input(z.object({ id: z.number().int() }))
  .query(async ({ ctx, input }) => {
    const lines = await ctx.db.bingoPatternLine.findMany({
      select: {
        id: true,
        indexPattern: true,
      },
      where: { bingoId: input.id }
    });
    return lines.map(line => {
      return {
        ...line,
        indexPattern: JSON.parse(line.indexPattern) as BingoPatternLine[],
      };
    });
  }),

  updatePattern: adminProcedure.input(z.object({
    id: z.number().int(),
    name: z.string().max(100).min(1).optional(),
    description: z.string().max(100).optional(),
  })).mutation(async ({ ctx, input }) => {
    const bingoPattern = await ctx.db.bingoPattern.findFirst({ where: { id: input.id } });
    if (!bingoPattern) {
      throw new Error("Bingo Pattern not found");
    }
    const updatedPattern = await ctx.db.bingoPattern.update({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description,
      }
    });
    return updatedPattern;
  }),

  updateBingoPatternLine: adminProcedure.input(z.object({
    id: z.number().int().positive(),
    indexPattern: z.array(z.object({
      x: z.number().int().min(0).max(4),
      y: z.number().int().min(0).max(4),
    }))
  })).mutation(async ({ ctx, input }) => {
    const line = await ctx.db.bingoPatternLine.findFirst({ where: { id: input.id } });
    if (!line) {
      throw new Error("Line not found");
    }
    const updatedLine = await ctx.db.bingoPatternLine.update({
      where: { id: input.id },
      data: {
        indexPattern: JSON.stringify(input.indexPattern),
      }
    });
    return updatedLine;
  }),
});

