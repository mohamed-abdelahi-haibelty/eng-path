import { requireSeedAdmin } from "../lib/seedAuth";
import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const seedSpeaking = mutation({
  args: {
    seedAdminKey: v.optional(v.string()),
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
    const { seedAdminKey, ...data } = args;
    requireSeedAdmin(seedAdminKey);
    await ctx.db.insert("speakingModules", {
      ...data,
      language: args.language ?? "en",
    });
  },
});
