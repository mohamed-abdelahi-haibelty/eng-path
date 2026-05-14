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
    unitId: v.id("units"),
    title: v.string(),
    passage: v.string(),
    wordCount: v.number(),
    questions: v.array(questionValidator),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("readingModules", args);
  },
});
