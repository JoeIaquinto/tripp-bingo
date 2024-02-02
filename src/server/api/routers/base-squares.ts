import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
} from "~/server/api/trpc";

export const baseSquareRouter = createTRPCRouter({
  createCategory: adminProcedure.input(z.object({
    name: z.string().max(100).min(1),
    description: z.string().max(100).optional(),
    gameType: z.enum(["hockey"]),
  })).mutation(async ({ ctx, input }) => {
    const category = await ctx.db.baseGameCategory.create({
      data: {
        name: input.name,
        description: input.description,
        gameType: input.gameType,
      }
    });
    return category;
  }),

  createCategorySquare: adminProcedure.input(z.object({
    baseGameCategoryId: z.string().cuid(),
    description: z.string().max(100),
    skaterType: z.enum(['F', 'D', 'G', 'Team', 'N/A']),
    stat: z.string().min(1),
    rangeMin: z.number().int().min(0),
    rangeMax: z.number().int().min(0),
    displayFormat: z.string().min(1),
  }))
  .mutation(async ({ ctx, input }) => {
    const category = await ctx.db.baseGameCategory.findFirst({ where: { id: input.baseGameCategoryId } });
    if (!category) {
      throw new Error("Category not found");
    }

    const square = await ctx.db.baseGameCategorySquare.create({
      data: {
        description: input.description,
        skaterType: input.skaterType,
        stat: input.stat,
        rangeMin: input.rangeMin,
        rangeMax: input.rangeMax,
        displayFormat: input.displayFormat,
        baseGameCategoryId: category.id,
      }
    });

    return square;
  }),

  listCategories: adminProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.baseGameCategory.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        gameType: true,
        _count: true,
      }
    });
    return categories;
  }),

  listSquares: adminProcedure.query(async ({ ctx }) => {
    const squares = await ctx.db.baseGameCategorySquare.findMany({
      select: {
        id: true,
        description: true,
        skaterType: true,
        stat: true,
        rangeMin: true,
        rangeMax: true,
        displayFormat: true,
        baseGameCategory: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    return squares;
  }),

  getCategory: adminProcedure.input(z.object({ id: z.string().cuid() }))
  .query(async ({ ctx, input }) => {
    const category = await ctx.db.baseGameCategory.findFirst({
      where: { id: input.id },
      include: {
        squares: true
      }
    });
    if (!category) {
      throw new Error("Category not found");
    }
    return category;
  }),

  updateCategory: adminProcedure.input(z.object({
    id: z.string().cuid(),
    name: z.string().max(100).min(1).optional(),
    description: z.string().max(100).optional(),
    gameType: z.enum(["hockey"]).optional(),
  })).mutation(async ({ ctx, input }) => {
    const category = await ctx.db.baseGameCategory.findFirst({ where: { id: input.id } });
    if (!category) {
      throw new Error("Category not found");
    }
    const updatedCategory = await ctx.db.baseGameCategory.update({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description,
        gameType: input.gameType,
      }
    });
    return updatedCategory;
  }),

  updateSquare: adminProcedure.input(z.object({
    id: z.number().int().positive(),
    description: z.string().max(100).optional(),
    skaterType: z.enum(['F', 'D', 'G', 'Team', 'N/A']).optional(),
    stat: z.string().min(1).optional(),
    rangeMin: z.number().int().min(0).optional(),
    rangeMax: z.number().int().min(0).optional(),
    displayFormat: z.string().min(1).optional(),
  })).mutation(async ({ ctx, input }) => {
    const square = await ctx.db.baseGameCategorySquare.findFirst({ where: { id: input.id } });
    if (!square) {
      throw new Error("Square not found");
    }
    const updatedSquare = await ctx.db.baseGameCategorySquare.update({
      where: { id: input.id },
      data: {
        description: input.description,
        skaterType: input.skaterType,
        stat: input.stat,
        rangeMin: input.rangeMin,
        rangeMax: input.rangeMax,
        displayFormat: input.displayFormat,
      }
    });
    return updatedSquare;
  }),
});

