import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { AppException } from "../../lib/errors";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new AppException("UNAUTHORIZED", "Please sign in.");
    return await ctx.storage.generateUploadUrl();
  },
});

export const submitSpeaking = mutation({
  args: {
    unitId: v.id("units"),
    responses: v.array(
      v.object({
        order: v.number(),
        question: v.string(),
        audioStorageId: v.id("_storage"),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new AppException("UNAUTHORIZED", "Please sign in.");

    const unit = await ctx.db.get(args.unitId);
    if (!unit) throw new AppException("NOT_FOUND", "Unit not found.");

    const fullResponses = args.responses.map((r) => ({
      order: r.order,
      question: r.question,
      audioStorageId: r.audioStorageId,
      evaluationStatus: "pending" as const,
    }));

    const submissionId = await ctx.db.insert("speakingSubmissions", {
      userId,
      unitId: args.unitId,
      language: unit.language,
      responses: fullResponses,
      overallEvaluationStatus: "pending",
      submittedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(
      0,
      internal.actions.speaking.evaluateSpeaking,
      { submissionId }
    );

    return { submissionId };
  },
});

export const storeResponseResult = internalMutation({
  args: {
    submissionId: v.id("speakingSubmissions"),
    order: v.number(),
    transcript: v.string(),
    wordCount: v.number(),
    scores: v.union(
      v.object({
        fluency: v.number(),
        coherence: v.number(),
        vocabulary: v.number(),
        grammar: v.number(),
      }),
      v.null()
    ),
    totalScore: v.union(v.number(), v.null()),
    feedback: v.union(v.string(), v.null()),
    suggestion: v.union(v.string(), v.null()),
    evaluationStatus: v.union(v.literal("done"), v.literal("error")),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) return;

    const updatedResponses = submission.responses.map((r) => {
      if (r.order !== args.order) return r;
      return {
        ...r,
        transcript: args.transcript || undefined,
        wordCount: args.wordCount,
        scores: args.scores ?? undefined,
        totalScore: args.totalScore ?? undefined,
        feedback: args.feedback ?? undefined,
        suggestion: args.suggestion ?? undefined,
        evaluationStatus: args.evaluationStatus,
      };
    });

    await ctx.db.patch(args.submissionId, { responses: updatedResponses });
  },
});

export const finalizeSpeaking = internalMutation({
  args: {
    submissionId: v.id("speakingSubmissions"),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) return;

    const errorCount = submission.responses.filter(
      (r) => r.evaluationStatus === "error"
    ).length;

    const overallScore = submission.responses.reduce(
      (sum, r) => sum + (r.totalScore ?? 0),
      0
    );

    const overallEvaluationStatus: "done" | "error" =
      errorCount > submission.responses.length / 2 ? "error" : "done";

    await ctx.db.patch(args.submissionId, {
      overallScore,
      overallEvaluationStatus,
    });

    const existing = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", submission.userId).eq("unitId", submission.unitId)
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        speakingCompleted: true,
        updatedAt: now,
      });
    } else {
      const unit = await ctx.db.get(submission.unitId);
      await ctx.db.insert("unitProgress", {
        userId: submission.userId,
        unitId: submission.unitId,
        language: unit?.language ?? "en",
        grammarCompleted: false,
        readingCompleted: false,
        listeningCompleted: false,
        listeningListensUsed: 0,
        writingCompleted: false,
        speakingCompleted: true,
        reviewCompleted: false,
        unitCompleted: false,
        updatedAt: now,
      });
    }
  },
});
