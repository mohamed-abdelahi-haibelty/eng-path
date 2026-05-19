import { getAuthUserId } from "@convex-dev/auth/server";
import { internalQuery, query } from "../_generated/server";
import { v } from "convex/values";

export const _untranslatedByUnit = internalQuery({
  args: { unitId: v.id("units") },
  handler: async (ctx, args) => {
    const words = await ctx.db
      .query("vocabulary")
      .withIndex("by_unit", (q) => q.eq("unitId", args.unitId))
      .take(100);

    return words
      .filter((w) => !w.arabicTranslation)
      .map((w) => ({ _id: w._id, word: w.word }));
  },
});

export const vocabularyByUnit = query({
  args: { unitId: v.id("units") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const words = await ctx.db
      .query("vocabulary")
      .withIndex("by_unit", (q) => q.eq("unitId", args.unitId))
      .take(100);

    // Sort alphabetically
    words.sort((a, b) => a.word.localeCompare(b.word));

    // Check which words are already in user's flashcard deck
    const flashcards = await ctx.db
      .query("flashcards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(500);

    const inDeckSet = new Set(flashcards.map((f) => f.vocabularyId));

    return words.map((w) => ({
      _id: w._id,
      word: w.word,
      partOfSpeech: w.partOfSpeech,
      phonetics: w.phonetics,
      audioUrl: w.audioUrl,
      arabicTranslation: w.arabicTranslation,
      inDeck: inDeckSet.has(w._id),
    }));
  },
});
