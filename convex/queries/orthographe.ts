import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { v } from "convex/values";

const LEVEL_VALIDATOR = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2"),
);

export const orthographeBySlug = query({
  args: { level: LEVEL_VALIDATOR, slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const unit = await ctx.db
      .query("units")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!unit || unit.level !== args.level) return null;
    if (unit.language !== "fr") return null;

    const module_ = await ctx.db
      .query("orthographeModules")
      .withIndex("by_unit", (q) => q.eq("unitId", unit._id))
      .unique();

    if (!module_) return null;

    const progress = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", userId).eq("unitId", unit._id),
      )
      .unique();

    return {
      unit: {
        _id: unit._id,
        level: unit.level,
        unitNumber: unit.unitNumber,
        slug: unit.slug,
        topic: unit.topic,
      },
      module: {
        rule: module_.rule,
        explanationMarkdown: module_.explanationMarkdown,
        examples: module_.examples,
        exercises: module_.exercises,
      },
      progress: {
        conjugaisonCompleted: progress?.conjugaisonCompleted ?? false,
        conjugaisonScore: progress?.conjugaisonScore ?? null,
        orthographeCompleted: progress?.orthographeCompleted ?? false,
        orthographeScore: progress?.orthographeScore ?? null,
      },
    };
  },
});
