import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";

const LEVELS = ["A1", "A2", "B1", "B2"] as const;

export const homeData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    // All progress records for this user (bounded by the 120-unit curriculum)
    const allProgress = await ctx.db
      .query("unitProgress")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(120);

    const progressByUnitId = new Map(allProgress.map((p) => [p.unitId, p]));

    // Per-level stats: fetch units by level and count completions
    const levels = await Promise.all(
      LEVELS.map(async (level) => {
        const units = await ctx.db
          .query("units")
          .withIndex("by_level", (q) => q.eq("level", level))
          .take(30);
        const completedUnits = units.filter(
          (u) => progressByUnitId.get(u._id)?.unitCompleted
        ).length;
        return { level, totalUnits: units.length, completedUnits };
      })
    );

    // Most recently active unit — find the highest updatedAt progress record
    let continueUnit: {
      slug: string;
      level: string;
      unitNumber: number;
      topic: string;
    } | null = null;

    if (allProgress.length > 0) {
      const mostRecent = allProgress.reduce((best, curr) =>
        curr.updatedAt > best.updatedAt ? curr : best
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

    // Due flashcards, capped at 100 for display purposes
    const dueCards = await ctx.db
      .query("flashcards")
      .withIndex("by_userId_and_due", (q) =>
        q.eq("userId", userId).lte("due", Date.now())
      )
      .take(101);

    return {
      user: { name: user.name ?? null, image: user.image ?? null },
      levels,
      continueUnit,
      dueFlashcards: Math.min(dueCards.length, 100),
    };
  },
});
