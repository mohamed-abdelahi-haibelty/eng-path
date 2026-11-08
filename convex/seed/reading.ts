import { requireSeedAdmin } from "../lib/seedAuth";
import { v } from "convex/values";
import { mutation } from "../_generated/server";

const questionValidator = v.object({
  id: v.string(),
  question: v.string(),
  options: v.object({
    a: v.string(),
    b: v.string(),
    c: v.string(),
    d: v.string(),
  }),
  correct: v.string(),
  explanation: v.string(),
});

export const seedReading = mutation({
  args: {
    seedAdminKey: v.optional(v.string()),
    unitId: v.id("units"),
    language: v.optional(v.union(v.literal("en"), v.literal("fr"))),
    title: v.string(),
    passage: v.string(),
    wordCount: v.number(),
    questions: v.array(questionValidator),
  },
  handler: async (ctx, args) => {
    const { seedAdminKey, ...data } = args;
    requireSeedAdmin(seedAdminKey);
    await ctx.db.insert("readingModules", {
      ...data,
      language: args.language ?? "en",
    });
  },
});
