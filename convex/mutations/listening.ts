import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { AppException } from "../../lib/errors";

export const submitListeningScore = mutation({
  args: {
    unitId: v.id("units"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppException("UNAUTHORIZED", "Please sign in to submit your score.");
    }

    if (args.score < 0 || args.score > 100) {
      throw new AppException("VALIDATION_ERROR", "Score must be between 0 and 100.", {
        field: "score",
      });
    }

    const unit = await ctx.db.get(args.unitId);
    if (!unit) {
      throw new AppException("NOT_FOUND", "Unit not found.");
    }

    const completed = args.score >= 60;
    const now = Date.now();

    const existing = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", userId).eq("unitId", args.unitId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        listeningCompleted: completed,
        listeningScore: args.score,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("unitProgress", {
        userId,
        unitId: args.unitId,
        language: unit.language,
        grammarCompleted: false,
        grammarScore: undefined,
        readingCompleted: false,
        readingScore: undefined,
        listeningCompleted: completed,
        listeningScore: args.score,
        listeningListensUsed: 0,
        writingCompleted: false,
        speakingCompleted: false,
        reviewCompleted: false,
        reviewScore: undefined,
        unitCompleted: false,
        updatedAt: now,
      });
    }

    return { completed, score: args.score };
  },
});

export const recordListen = mutation({
  args: {
    unitId: v.id("units"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppException("UNAUTHORIZED", "Please sign in.");
    }

    const unit = await ctx.db.get(args.unitId);
    if (!unit) {
      throw new AppException("NOT_FOUND", "Unit not found.");
    }

    const now = Date.now();

    const existing = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", userId).eq("unitId", args.unitId)
      )
      .unique();

    const currentListens = existing?.listeningListensUsed ?? 0;
    if (currentListens >= 2) {
      return { listensUsed: 2 };
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        listeningListensUsed: currentListens + 1,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("unitProgress", {
        userId,
        unitId: args.unitId,
        language: unit.language,
        grammarCompleted: false,
        grammarScore: undefined,
        readingCompleted: false,
        readingScore: undefined,
        listeningCompleted: false,
        listeningScore: undefined,
        listeningListensUsed: 1,
        writingCompleted: false,
        speakingCompleted: false,
        reviewCompleted: false,
        reviewScore: undefined,
        unitCompleted: false,
        updatedAt: now,
      });
    }

    return { listensUsed: currentListens + 1 };
  },
});
