import { requireSeedAdmin } from "../lib/seedAuth";
import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const seedWriting = mutation({
  args: {
    seedAdminKey: v.optional(v.string()),
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
    const { seedAdminKey, ...data } = args;
    requireSeedAdmin(seedAdminKey);
    await ctx.db.insert("writingModules", {
      ...data,
      language: args.language ?? "en",
    });
  },
});
