import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { AppException } from "../../lib/errors";

export const submitWriting = mutation({
  args: {
    unitId: v.id("units"),
    text: v.string(),
    wordCount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppException("UNAUTHORIZED", "Please sign in to submit.");
    }

    if (args.wordCount < 1) {
      throw new AppException("VALIDATION_ERROR", "Response cannot be empty.", {
        field: "text",
      });
    }

    const unit = await ctx.db.get(args.unitId);
    if (!unit) {
      throw new AppException("NOT_FOUND", "Unit not found.");
    }

    const submissionId = await ctx.db.insert("writingSubmissions", {
      userId,
      unitId: args.unitId,
      language: unit.language,
      text: args.text,
      wordCount: args.wordCount,
      feedbackStatus: "pending",
      submittedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.actions.writing.evaluateWriting, {
      submissionId,
      unitId: args.unitId,
    });

    return { submissionId };
  },
});

export const retryEvaluation = mutation({
  args: {
    submissionId: v.id("writingSubmissions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppException("UNAUTHORIZED", "Please sign in.");
    }

    const submission = await ctx.db.get(args.submissionId);
    if (!submission || submission.userId !== userId) {
      throw new AppException("NOT_FOUND", "Submission not found.");
    }

    await ctx.db.patch(args.submissionId, { feedbackStatus: "pending" });

    await ctx.scheduler.runAfter(0, internal.actions.writing.evaluateWriting, {
      submissionId: args.submissionId,
      unitId: submission.unitId,
    });

    return null;
  },
});

export const storeWritingFeedback = internalMutation({
  args: {
    submissionId: v.id("writingSubmissions"),
    unitId: v.id("units"),
    overallScore: v.number(),
    dimensions: v.object({
      taskResponse: v.number(),
      coherence: v.number(),
      vocabulary: v.number(),
      grammar: v.number(),
    }),
    strengths: v.array(v.string()),
    weaknesses: v.array(v.string()),
    modelRewrite: v.string(),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) return;

    await ctx.db.patch(args.submissionId, {
      score: args.overallScore,
      dimensions: args.dimensions,
      strengths: args.strengths,
      weaknesses: args.weaknesses,
      modelRewrite: args.modelRewrite,
      feedbackStatus: "done",
    });

    const existing = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", submission.userId).eq("unitId", args.unitId)
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        writingCompleted: true,
        updatedAt: now,
      });
    } else {
      const unit = await ctx.db.get(args.unitId);
      await ctx.db.insert("unitProgress", {
        userId: submission.userId,
        unitId: args.unitId,
        language: unit?.language ?? "en",
        grammarCompleted: false,
        readingCompleted: false,
        listeningCompleted: false,
        listeningListensUsed: 0,
        writingCompleted: true,
        speakingCompleted: false,
        reviewCompleted: false,
        unitCompleted: false,
        updatedAt: now,
      });
    }
  },
});

export const markWritingFailed = internalMutation({
  args: {
    submissionId: v.id("writingSubmissions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.submissionId, { feedbackStatus: "error" });
  },
});
