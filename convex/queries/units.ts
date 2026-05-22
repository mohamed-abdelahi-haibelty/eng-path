import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { v } from "convex/values";

const LEVEL_VALIDATOR = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2"),
);
const LANGUAGE = v.union(v.literal("en"), v.literal("fr"));

export const unitsByLevel = query({
  args: { level: LEVEL_VALIDATOR, language: LANGUAGE },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const units = await ctx.db
      .query("units")
      .withIndex("by_language_and_level", (q) =>
        q.eq("language", args.language).eq("level", args.level),
      )
      .take(30);

    const totalModules = args.language === "fr" ? 8 : 6;

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
          if (args.language === "fr") {
            if (progress.conjugaisonCompleted) completedModules++;
            if (progress.orthographeCompleted) completedModules++;
          }
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
          totalModules,
        };
      }),
    );

    unitsWithProgress.sort((a, b) => a.unitNumber - b.unitNumber);

    return { level: args.level, units: unitsWithProgress };
  },
});
