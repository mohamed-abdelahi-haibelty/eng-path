import { requireSeedAdmin } from "../lib/seedAuth";
import { v } from "convex/values";
import { mutation } from "../_generated/server";

const reviewExerciseValidator = v.object({
  id: v.string(),
  instruction: v.string(),
  exercise: v.union(
    v.object({
      type: v.literal("vocabulary_choice"),
      sentence: v.string(),
      options: v.array(v.string()),
      correct: v.string(),
      explanation: v.string(),
    }),
    v.object({
      type: v.literal("vocabulary_definition"),
      word: v.optional(v.string()),
      options: v.array(v.string()),
      correct: v.string(),
      explanation: v.string(),
    }),
    v.object({
      type: v.literal("odd_one_out"),
      words: v.array(v.string()),
      correct: v.string(),
      explanation: v.string(),
    }),
    v.object({
      type: v.literal("fill_in_the_blank"),
      sentence: v.string(),
      options: v.optional(v.array(v.string())),
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
      type: v.literal("comprehension_recall"),
      source: v.union(v.literal("reading"), v.literal("listening")),
      question: v.string(),
      options: v.array(v.string()),
      correct: v.string(),
      explanation: v.string(),
    }),
    v.object({
      type: v.literal("true_or_false"),
      statement: v.string(),
      answer: v.boolean(),
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
      type: v.literal("multiple_choice_grammar"),
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
  ),
});

export const seedReview = mutation({
  args: {
    seedAdminKey: v.optional(v.string()),
    unitId: v.id("units"),
    language: v.optional(v.union(v.literal("en"), v.literal("fr"))),
    exercises: v.array(reviewExerciseValidator),
  },
  handler: async (ctx, args) => {
    requireSeedAdmin(args.seedAdminKey);
    const language = args.language ?? "en";
    for (const ex of args.exercises) {
      await ctx.db.insert("reviewExercises", {
        unitId: args.unitId,
        language,
        id: ex.id,
        instruction: ex.instruction,
        exercise: ex.exercise,
      });
    }
    return { exerciseCount: args.exercises.length };
  },
});
