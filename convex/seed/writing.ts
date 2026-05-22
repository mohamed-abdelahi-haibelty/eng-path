import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const seedWriting = mutation({
  args: {
    unitId: v.id("units"),
    language: v.optional(v.union(v.literal("en"), v.literal("fr"))),
    prompt: v.string(),
    minWords: v.number(),
    maxWords: v.number(),
    rubric: v.object({
      taskResponse: v.string(),
      coherence: v.string(),
      vocabulary: v.string(),
      grammar: v.string(),
    }),
    suggestedVocab: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("writingModules", {
      ...args,
      language: args.language ?? "en",
    });
  },
});
