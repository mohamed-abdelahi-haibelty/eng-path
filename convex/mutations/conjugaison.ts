import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { AppException } from "../../lib/errors";

export const submitConjugaisonScore = mutation({
  args: {
    unitId: v.id("units"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new AppException(
        "UNAUTHORIZED",
        "Please sign in to submit your score.",
      );
    }

    if (args.score < 0 || args.score > 100) {
      throw new AppException(
        "VALIDATION_ERROR",
        "Score must be between 0 and 100.",
        { field: "score" },
      );
    }

    const unit = await ctx.db.get(args.unitId);
    if (!unit) throw new AppException("NOT_FOUND", "Unit not found.");
    if (unit.language !== "fr") {
      throw new AppException(
        "PRECONDITION_FAILED",
        "Conjugaison module is only available for French units.",
      );
    }

    const existing = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", userId).eq("unitId", args.unitId),
      )
      .unique();

    if (
      !existing?.grammarCompleted ||
      (existing.grammarScore ?? 0) < 70
    ) {
      throw new AppException(
        "PRECONDITION_FAILED",
        "Complete Grammar with a score of 70% or higher before Conjugaison.",
      );
    }

    const completed = args.score >= 70;
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        conjugaisonCompleted: completed,
        conjugaisonScore: args.score,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("unitProgress", {
        userId,
        unitId: args.unitId,
        language: "fr",
        grammarCompleted: false,
        grammarScore: undefined,
        conjugaisonCompleted: completed,
        conjugaisonScore: args.score,
        readingCompleted: false,
        readingScore: undefined,
        listeningCompleted: false,
        listeningScore: undefined,
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
