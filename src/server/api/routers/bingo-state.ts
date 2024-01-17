import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const bingoStateRouter = createTRPCRouter({
  
  getBingoState: protectedProcedure.query(async ({ ctx }) => {
    const state = await ctx.db.bingoState.findFirst({
      where: { id: 1 }
    });
    if (!state) {
      throw new Error("There should only be one bingo state");
    }
    if (!state.state) {
      return false;
    }
    return state;
  }),

  resetBingoState: adminProcedure.mutation(async ({ ctx }) => {
    const state = await ctx.db.bingoState.findFirst({
      where: { id: 1 }
    });
    if (!state) {
      throw new Error("There should only be one bingo state");
    }
    const update = await ctx.db.bingoState.update({
      where: { id: state.id },
      data: { state: false, message: "", winner: "" },
    });
    return update;
  })
});