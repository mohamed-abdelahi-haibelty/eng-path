import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const seedSpeaking = mutation({
  args: {
    unitId: v.id("units"),
    language: v.optional(v.union(v.literal("en"), v.literal("fr"))),
    questions: v.array(
      v.object({
        order: v.number(),
        category: v.string(),
        question: v.string(),
        thinkSeconds: v.number(),
        speakSeconds: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("speakingModules", {
      ...args,
      language: args.language ?? "en",
    });
  },
});
