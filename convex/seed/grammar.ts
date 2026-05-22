import { v } from "convex/values";
import { mutation } from "../_generated/server";

const languageValidator = v.optional(v.union(v.literal("en"), v.literal("fr")));

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
    language: languageValidator,
    explanationMarkdown: v.string(),
    examples: v.array(v.string()),
    exercises: v.optional(v.array(grammarExerciseValidator)),
  },
  handler: async (ctx, args) => {
    const language = args.language ?? "en";
    await ctx.db.insert("grammarModules", {
      unitId: args.unitId,
      language,
      explanationMarkdown: args.explanationMarkdown,
      examples: args.examples,
    });

    const exercises = args.exercises ?? [];
    for (const ex of exercises) {
      await ctx.db.insert("grammarExercises", {
        unitId: args.unitId,
        language,
        id: ex.id,
        instruction: ex.instruction,
        exercise: ex.exercise,
      });
    }

    return { exerciseCount: exercises.length };
  },
});
