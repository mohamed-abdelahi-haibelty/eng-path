import { getAuthUserId } from "@convex-dev/auth/server";
import { internalQuery, query } from "../_generated/server";
import { v } from "convex/values";

const LEVEL_VALIDATOR = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2")
);

export const speakingBySlug = query({
  args: { level: LEVEL_VALIDATOR, slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const unit = await ctx.db
      .query("units")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!unit || unit.level !== args.level) return null;

    const speakingModule = await ctx.db
      .query("speakingModules")
      .withIndex("by_unit", (q) => q.eq("unitId", unit._id))
      .unique();

    if (!speakingModule) return null;

    const submission = await ctx.db
      .query("speakingSubmissions")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", userId).eq("unitId", unit._id)
      )
      .order("desc")
      .first();

    return {
      unit: {
        _id: unit._id,
        level: unit.level,
        unitNumber: unit.unitNumber,
        slug: unit.slug,
        topic: unit.topic,
      },
      questions: speakingModule.questions,
      submission: submission
        ? {
            _id: submission._id,
            responses: submission.responses,
            overallScore: submission.overallScore ?? null,
            overallEvaluationStatus: submission.overallEvaluationStatus,
            submittedAt: submission.submittedAt,
          }
        : null,
    };
  },
});

export const _submissionById = internalQuery({
  args: { submissionId: v.id("speakingSubmissions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.submissionId);
  },
});
