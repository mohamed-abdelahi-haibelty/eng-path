import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { v } from "convex/values";

const LEVEL_VALIDATOR = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2"),
);

export const unitsByLevel = query({
  args: { level: LEVEL_VALIDATOR },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const units = await ctx.db
      .query("units")
      .withIndex("by_level", (q) => q.eq("level", args.level))
      .take(30);

    const unitsWithProgress = await Promise.all(
      units.map(async (unit) => {
        const progress = await ctx.db
          .query("unitProgress")
          .withIndex("by_userId_and_unitId", (q) =>
            q.eq("userId", userId).eq("unitId", unit._id),
          )
          .unique();

        let completedModules = 0;
        if (progress) {
          if (progress.grammarCompleted) completedModules++;
          if (progress.readingCompleted) completedModules++;
          if (progress.listeningCompleted) completedModules++;
          if (progress.writingCompleted) completedModules++;
          if (progress.speakingCompleted) completedModules++;
          if (progress.reviewCompleted) completedModules++;
        }

        return {
          _id: unit._id,
          slug: unit.slug,
          unitNumber: unit.unitNumber,
          topic: unit.topic,
          unitCompleted: progress?.unitCompleted ?? false,
          completedModules,
          totalModules: 6,
        };
      }),
    );

    unitsWithProgress.sort((a, b) => a.unitNumber - b.unitNumber);

    return { level: args.level, units: unitsWithProgress };
  },
});
