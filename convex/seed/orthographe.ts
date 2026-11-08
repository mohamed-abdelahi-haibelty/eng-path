import { requireSeedAdmin } from "../lib/seedAuth";
import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const seedOrthographe = mutation({
  args: {
    seedAdminKey: v.optional(v.string()),
    unitId: v.id("units"),
    rule: v.string(),
    explanationMarkdown: v.string(),
    examples: v.array(v.string()),
    exercises: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("correct_the_spelling"),
          v.literal("choose_correct_spelling"),
          v.literal("fill_accent"),
          v.literal("gender_agreement"),
        ),
        instruction: v.string(),
        question: v.string(),
        options: v.optional(v.array(v.string())),
        answer: v.string(),
        explanation: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    requireSeedAdmin(args.seedAdminKey);
    await ctx.db.insert("orthographeModules", {
      unitId: args.unitId,
      language: "fr",
      rule: args.rule,
      explanationMarkdown: args.explanationMarkdown,
      examples: args.examples,
      exercises: args.exercises,
    });
    return { exerciseCount: args.exercises.length };
  },
});
