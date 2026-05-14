import { v } from "convex/values";
import { mutation } from "../_generated/server";

const levelValidator = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2"),
);

export const seedVocabularyBatch = mutation({
  args: {
    words: v.array(
      v.object({
        word: v.string(),
        cefrLevel: levelValidator,
        partOfSpeech: v.string(),
        phonetics: v.string(),
        audioUrl: v.string(),
        unitId: v.optional(v.id("units")),
        topic: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const w of args.words) {
      await ctx.db.insert("vocabulary", w);
    }
    return { inserted: args.words.length };
  },
});
