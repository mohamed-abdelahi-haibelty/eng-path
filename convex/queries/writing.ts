import { getAuthUserId } from "@convex-dev/auth/server";
import { internalQuery, query } from "../_generated/server";
import { v } from "convex/values";

const LEVEL_VALIDATOR = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2")
);

export const writingBySlug = query({
  args: { level: LEVEL_VALIDATOR, slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const unit = await ctx.db
      .query("units")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!unit || unit.level !== args.level) return null;

    const writingModule = await ctx.db
      .query("writingModules")
      .withIndex("by_unit", (q) => q.eq("unitId", unit._id))
      .unique();

    if (!writingModule) return null;

    const submission = await ctx.db
      .query("writingSubmissions")
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
      module: {
        _id: writingModule._id,
        prompt: writingModule.prompt,
        minWords: writingModule.minWords,
        maxWords: writingModule.maxWords,
        rubric: writingModule.rubric,
        suggestedVocab: writingModule.suggestedVocab,
      },
      submission: submission
        ? {
            _id: submission._id,
            text: submission.text,
            wordCount: submission.wordCount,
            score: submission.score,
            dimensions: submission.dimensions,
            strengths: submission.strengths,
            weaknesses: submission.weaknesses,
            modelRewrite: submission.modelRewrite,
            feedbackStatus: submission.feedbackStatus,
            submittedAt: submission.submittedAt,
          }
        : null,
    };
  },
});

export const _submissionById = internalQuery({
  args: { submissionId: v.id("writingSubmissions") },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) return null;

    const writingModule = await ctx.db
      .query("writingModules")
      .withIndex("by_unit", (q) => q.eq("unitId", submission.unitId))
      .unique();

    const unit = await ctx.db.get(submission.unitId);

    if (!writingModule || !unit) return null;

    return {
      text: submission.text,
      writingModule: {
        prompt: writingModule.prompt,
        rubric: writingModule.rubric,
      },
      unit: {
        level: unit.level,
        language: unit.language ?? "en",
      },
    };
  },
});
