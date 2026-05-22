import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { v } from "convex/values";

const LANGUAGE = v.union(v.literal("en"), v.literal("fr"));

export const dueCards = query({
  args: { language: LANGUAGE },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const now = Date.now();

    // Pull a wider window since we filter by vocabulary language below.
    const dueFlashcards = await ctx.db
      .query("flashcards")
      .withIndex("by_userId_and_due", (q) =>
        q.eq("userId", userId).lte("due", now),
      )
      .take(400);

    const dueInLanguage = (
      await Promise.all(
        dueFlashcards.map(async (fc) => {
          const vocab = await ctx.db.get(fc.vocabularyId);
          if (!vocab) return null;
          const vocabLang = vocab.language ?? "en";
          if (vocabLang !== args.language) return null;
          return { fc, vocab };
        }),
      )
    ).filter((c): c is NonNullable<typeof c> => c !== null);

    if (dueInLanguage.length === 0) {
      // Find next-due card in this language for the "all_done" hint.
      const allCardsRaw = await ctx.db
        .query("flashcards")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(2000);

      let hasAny = false;
      let nextDue: number | null = null;
      for (const card of allCardsRaw) {
        const vocab = await ctx.db.get(card.vocabularyId);
        if (!vocab) continue;
        const vocabLang = vocab.language ?? "en";
        if (vocabLang !== args.language) continue;
        hasAny = true;
        if (nextDue === null || card.due < nextDue) nextDue = card.due;
      }

      if (!hasAny) return { status: "empty_deck" as const };
      return { status: "all_done" as const, nextDue };
    }

    const cards = dueInLanguage.slice(0, 200).map(({ fc, vocab }) => ({
      flashcardId: fc._id,
      stability: fc.stability,
      difficulty: fc.difficulty,
      elapsedDays: fc.elapsedDays,
      scheduledDays: fc.scheduledDays,
      reps: fc.reps,
      lapses: fc.lapses,
      state: fc.state,
      due: fc.due,
      lastReview: fc.lastReview ?? null,
      word: vocab.word,
      partOfSpeech: vocab.partOfSpeech,
      phonetics: vocab.phonetics,
      audioUrl: vocab.audioUrl,
      arabicTranslation: vocab.arabicTranslation ?? null,
    }));

    return { status: "active" as const, cards };
  },
});

export const deckStats = query({
  args: { language: LANGUAGE },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const now = Date.now();

    const allCardsRaw = await ctx.db
      .query("flashcards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(2000);

    // Filter to cards whose vocabulary matches the requested language.
    const allCards: Array<(typeof allCardsRaw)[number]> = [];
    for (const card of allCardsRaw) {
      const vocab = await ctx.db.get(card.vocabularyId);
      if (!vocab) continue;
      const vocabLang = vocab.language ?? "en";
      if (vocabLang === args.language) allCards.push(card);
    }

    const total = allCards.length;
    const stateCounts = { new: 0, learning: 0, review: 0, relearning: 0 };

    const todayEnd = (() => {
      const d = new Date(now);
      d.setUTCHours(23, 59, 59, 999);
      return d.getTime();
    })();

    let dueToday = 0;
    for (const card of allCards) {
      stateCounts[card.state]++;
      if (card.due <= todayEnd) dueToday++;
    }

    // Reviews keyed against this language's flashcards.
    const cardIds = new Set(allCards.map((c) => c._id));
    const allReviewsRaw = await ctx.db
      .query("flashcardReviews")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(20000);
    const allReviews = allReviewsRaw.filter((r) => cardIds.has(r.flashcardId));

    const totalReviews = allReviews.length;

    const reviewsByDay: Record<string, number> = {};
    for (const r of allReviews) {
      const d = new Date(r.reviewedAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      reviewsByDay[key] = (reviewsByDay[key] ?? 0) + 1;
    }

    let streak = 0;
    const todayUTC = new Date(now);
    const todayKey = `${todayUTC.getUTCFullYear()}-${String(todayUTC.getUTCMonth() + 1).padStart(2, "0")}-${String(todayUTC.getUTCDate()).padStart(2, "0")}`;

    for (let i = 0; i <= 365; i++) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      if (reviewsByDay[key]) {
        streak++;
      } else {
        break;
      }
    }

    const heatmap: Array<{ date: string; count: number }> = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      heatmap.push({ date: key, count: reviewsByDay[key] ?? 0 });
    }

    return {
      total,
      stateCounts,
      dueToday,
      totalReviews,
      streak,
      heatmap,
      todayKey,
    };
  },
});
