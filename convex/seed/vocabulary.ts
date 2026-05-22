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
        language: v.optional(v.union(v.literal("en"), v.literal("fr"))),
        word: v.string(),
        cefrLevel: levelValidator,
        partOfSpeech: v.string(),
        phonetics: v.string(),
        audioUrl: v.optional(v.string()),
        unitId: v.optional(v.id("units")),
        topic: v.optional(v.string()),
        arabicTranslation: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const w of args.words) {
      await ctx.db.insert("vocabulary", {
        language: w.language ?? "en",
        word: w.word,
        cefrLevel: w.cefrLevel,
        partOfSpeech: w.partOfSpeech,
        phonetics: w.phonetics,
        audioUrl: w.audioUrl ?? "",
        unitId: w.unitId,
        topic: w.topic,
        arabicTranslation: w.arabicTranslation,
      });
    }
    return { inserted: args.words.length };
  },
});
