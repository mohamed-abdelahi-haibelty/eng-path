import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const seedConjugaison = mutation({
  args: {
    unitId: v.id("units"),
    verb: v.string(),
    tense: v.string(),
    conjugationTable: v.array(
      v.object({
        pronoun: v.string(),
        form: v.string(),
      }),
    ),
    irregularNotes: v.optional(v.string()),
    exercises: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal("fill_conjugation"),
          v.literal("choose_correct_form"),
          v.literal("transform_tense"),
          v.literal("error_correction"),
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
    await ctx.db.insert("conjugaisonModules", {
      unitId: args.unitId,
      language: "fr",
      verb: args.verb,
      tense: args.tense,
      conjugationTable: args.conjugationTable,
      irregularNotes: args.irregularNotes,
      exercises: args.exercises,
    });
    return { exerciseCount: args.exercises.length };
  },
});
