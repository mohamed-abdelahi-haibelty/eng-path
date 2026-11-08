import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { v } from "convex/values";

const LEVELS = ["A1", "A2", "B1", "B2"] as const;
const LANGUAGE = v.union(v.literal("en"), v.literal("fr"));

export const homeData = query({
  args: { language: LANGUAGE },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    // All progress records for this user in this language.
    const allProgress = await ctx.db
      .query("unitProgress")
      .withIndex("by_language_and_userId", (q) =>
        q.eq("language", args.language).eq("userId", userId),
      )
      .take(120);

    const progressByUnitId = new Map(allProgress.map((p) => [p.unitId, p]));

    const levels = await Promise.all(
      LEVELS.map(async (level) => {
        const units = await ctx.db
          .query("units")
          .withIndex("by_language_and_level", (q) =>
            q.eq("language", args.language).eq("level", level),
          )
          .take(30);
        const completedUnits = units.filter(
          (u) => progressByUnitId.get(u._id)?.unitCompleted,
        ).length;
        return { level, totalUnits: units.length, completedUnits };
      }),
    );

    // Most recently active unit within this language.
    let continueUnit: {
      slug: string;
      level: string;
      unitNumber: number;
      topic: string;
    } | null = null;

    if (allProgress.length > 0) {
      const mostRecent = allProgress.reduce((best, curr) =>
        curr.updatedAt > best.updatedAt ? curr : best,
      );
      const unit = await ctx.db.get(mostRecent.unitId);
      if (unit) {
        continueUnit = {
          slug: unit.slug,
          level: unit.level,
          unitNumber: unit.unitNumber,
          topic: unit.topic,
        };
      }
    }

    // Flashcards joined with vocabulary so we can filter by language.
    const dueCards = await ctx.db
      .query("flashcards")
      .withIndex("by_userId_and_due", (q) =>
        q.eq("userId", userId).lte("due", Date.now()),
      )
      .take(300);

    let dueInLanguage = 0;
    for (const card of dueCards) {
      const vocab = await ctx.db.get(card.vocabularyId);
      if (!vocab) continue;
      const vocabLanguage = vocab.language ?? "en";
      if (vocabLanguage === args.language) {
        dueInLanguage++;
        if (dueInLanguage >= 100) break;
      }
    }

    // Check whether the user has any flashcards in this language at all
    // (to distinguish "all done for today" from "empty deck").
    let hasFlashcardsDeck = dueInLanguage > 0;
    if (!hasFlashcardsDeck) {
      const allCards = await ctx.db
        .query("flashcards")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(200);
      for (const card of allCards) {
        const vocab = await ctx.db.get(card.vocabularyId);
        if (!vocab) continue;
        if ((vocab.language ?? "en") === args.language) {
          hasFlashcardsDeck = true;
          break;
        }
      }
    }

    return {
      user: { name: user.name ?? null, image: user.image ?? null },
      levels,
      continueUnit,
      dueFlashcards: Math.min(dueInLanguage, 100),
      hasFlashcardsDeck,
    };
  },
});

/**
 * Aggregate progress in BOTH languages, for the root picker page.
 */
export const languageOverview = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const computeFor = async (language: "en" | "fr") => {
      const progress = await ctx.db
        .query("unitProgress")
        .withIndex("by_language_and_userId", (q) =>
          q.eq("language", language).eq("userId", userId),
        )
        .take(120);

      const completedUnits = progress.filter((p) => p.unitCompleted).length;
      const lastUpdatedAt =
        progress.length > 0
          ? progress.reduce((m, p) => Math.max(m, p.updatedAt), 0)
          : null;

      // Total units in the curriculum for this language (120 expected).
      const allUnits = await ctx.db
        .query("units")
        .withIndex("by_language_and_level", (q) => q.eq("language", language))
        .take(120);

      return {
        language,
        completedUnits,
        totalUnits: allUnits.length,
        lastUpdatedAt,
      };
    };

    const [en, fr] = await Promise.all([computeFor("en"), computeFor("fr")]);
    return {
      user: { name: user.name ?? null, image: user.image ?? null },
      en,
      fr,
    };
  },
});
