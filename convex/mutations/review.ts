import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { AppException } from "../../lib/errors";

export const submitReview = mutation({
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

    const now = Date.now();

    const existing = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", userId).eq("unitId", args.unitId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        reviewCompleted: true,
        reviewScore: args.score,
        unitCompleted: true,
        completedAt: existing.completedAt ?? now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("unitProgress", {
        userId,
        unitId: args.unitId,
        language: unit.language,
        grammarCompleted: false,
        readingCompleted: false,
        listeningCompleted: false,
        writingCompleted: false,
        speakingCompleted: false,
        reviewCompleted: true,
        reviewScore: args.score,
        listeningListensUsed: 0,
        unitCompleted: true,
        completedAt: now,
        updatedAt: now,
      });
    }

    return { score: args.score };
  },
});
