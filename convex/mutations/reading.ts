import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import { AppException } from "../../lib/errors";

export const submitReadingScore = mutation({
  args: {
    unitId: v.id("units"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppException("UNAUTHORIZED", "Please sign in to submit your score.");
    }

    if (args.score < 0 || args.score > 100) {
      throw new AppException("VALIDATION_ERROR", "Score must be between 0 and 100.", {
        field: "score",
      });
    }

    const unit = await ctx.db.get(args.unitId);
    if (!unit) {
      throw new AppException("NOT_FOUND", "Unit not found.");
    }

    const completed = args.score >= 60;
    const now = Date.now();

    const existing = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", userId).eq("unitId", args.unitId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        readingCompleted: completed,
        readingScore: args.score,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("unitProgress", {
        userId,
        unitId: args.unitId,
        grammarCompleted: false,
        grammarScore: undefined,
        readingCompleted: completed,
        readingScore: args.score,
        listeningCompleted: false,
        listeningScore: undefined,
        listeningListensUsed: 0,
        writingCompleted: false,
        speakingCompleted: false,
        reviewCompleted: false,
        reviewScore: undefined,
        unitCompleted: false,
        updatedAt: now,
      });
    }

    return { completed, score: args.score };
  },
});

export const addToFlashcards = mutation({
  args: {
    vocabularyId: v.id("vocabulary"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppException("UNAUTHORIZED", "Please sign in to add flashcards.");
    }

    const existing = await ctx.db
      .query("flashcards")
      .withIndex("by_userId_and_vocabularyId", (q) =>
        q.eq("userId", userId).eq("vocabularyId", args.vocabularyId)
      )
      .unique();

    if (existing) return { alreadyInDeck: true };

    const now = Date.now();
    await ctx.db.insert("flashcards", {
      userId,
      vocabularyId: args.vocabularyId,
      stability: 0,
      difficulty: 5,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      state: "new",
      due: now,
      addedAt: now,
    });

    return { alreadyInDeck: false };
  },
});

export const storeArabicTranslationsBatch = internalMutation({
  args: {
    entries: v.array(
      v.object({ vocabularyId: v.id("vocabulary"), translation: v.string() })
    ),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.entries.map(({ vocabularyId, translation }) =>
        ctx.db.patch(vocabularyId, { arabicTranslation: translation })
      )
    );
  },
});
