import { v } from "convex/values";
import { mutation } from "../_generated/server";

const grammarExerciseValidator = v.object({
  id: v.string(),
  instruction: v.string(),
  exercise: v.union(
    v.object({
      type: v.literal("fill_in_the_blank"),
      sentence: v.string(),
      options: v.optional(v.array(v.string())),
      answer: v.string(),
      explanation: v.string(),
    }),
    v.object({
      type: v.literal("multiple_choice"),
      sentence: v.optional(v.string()),
      options: v.object({
        a: v.string(),
        b: v.string(),
        c: v.string(),
        d: v.string(),
      }),
      correct: v.string(),
      explanation: v.string(),
    }),
    v.object({
      type: v.literal("sentence_transformation"),
      original: v.string(),
      prompt: v.optional(v.string()),
      answer: v.string(),
      explanation: v.string(),
    }),
    v.object({
      type: v.literal("error_correction"),
      incorrect: v.string(),
      correct: v.string(),
      explanation: v.string(),
    }),
    v.object({
      type: v.literal("build_a_sentence"),
      scrambled: v.array(v.string()),
      answer: v.string(),
      explanation: v.string(),
    }),
  ),
});

export const seedGrammarModule = mutation({
  args: {
    unitId: v.id("units"),
    explanationMarkdown: v.string(),
    examples: v.array(v.string()),
    exercises: v.array(grammarExerciseValidator),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("grammarModules", {
      unitId: args.unitId,
      explanationMarkdown: args.explanationMarkdown,
      examples: args.examples,
    });

    for (const ex of args.exercises) {
      await ctx.db.insert("grammarExercises", {
        unitId: args.unitId,
        id: ex.id,
        instruction: ex.instruction,
        exercise: ex.exercise,
      });
    }

    return { exerciseCount: args.exercises.length };
  },
});
