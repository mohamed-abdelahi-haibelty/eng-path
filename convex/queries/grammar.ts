import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { v } from "convex/values";

const LEVEL_VALIDATOR = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2")
);

export const grammarBySlug = query({
  args: { level: LEVEL_VALIDATOR, slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const unit = await ctx.db
      .query("units")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!unit || unit.level !== args.level) return null;

    const grammarModule = await ctx.db
      .query("grammarModules")
      .withIndex("by_unit", (q) => q.eq("unitId", unit._id))
      .unique();

    if (!grammarModule) return null;

    const exercises = await ctx.db
      .query("grammarExercises")
      .withIndex("by_unit", (q) => q.eq("unitId", unit._id))
      .take(20);

    const progress = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", userId).eq("unitId", unit._id)
      )
      .unique();

    return {
      unit: {
        _id: unit._id,
        level: unit.level,
        unitNumber: unit.unitNumber,
        slug: unit.slug,
        topic: unit.topic,
        grammarPoint: unit.grammarPoint,
      },
      module: {
        explanationMarkdown: grammarModule.explanationMarkdown,
        examples: grammarModule.examples,
      },
      exercises,
      progress: {
        grammarCompleted: progress?.grammarCompleted ?? false,
        grammarScore: progress?.grammarScore,
      },
    };
  },
});
