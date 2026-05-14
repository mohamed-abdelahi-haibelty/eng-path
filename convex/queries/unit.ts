import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { v } from "convex/values";

const LEVEL_VALIDATOR = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2")
);

interface Module {
  name: string;
  completed: boolean;
  score?: number;
  locked: boolean;
  lockedReason?: string;
}

export const unitBySlug = query({
  args: { level: LEVEL_VALIDATOR, slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Fetch the unit by slug
    const unit = await ctx.db
      .query("units")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!unit) return null;

    // Fetch user progress for this unit
    const progress = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", userId).eq("unitId", unit._id)
      )
      .unique();

    // Build module list with lock states
    const modules: Module[] = [
      {
        name: "Grammar",
        completed: progress?.grammarCompleted ?? false,
        score: progress?.grammarScore,
        locked: false,
      },
      {
        name: "Reading",
        completed: progress?.readingCompleted ?? false,
        score: progress?.readingScore,
        locked: !progress?.grammarCompleted || (progress?.grammarScore ?? 0) < 70,
        lockedReason:
          !progress?.grammarCompleted
            ? "Complete Grammar first"
            : "Grammar score must be 70% or higher",
      },
      {
        name: "Listening",
        completed: progress?.listeningCompleted ?? false,
        score: progress?.listeningScore,
        locked: !progress?.readingCompleted,
        lockedReason: "Complete Reading first",
      },
      {
        name: "Writing",
        completed: progress?.writingCompleted ?? false,
        locked: !progress?.listeningCompleted,
        lockedReason: "Complete Listening first",
      },
      {
        name: "Speaking",
        completed: progress?.speakingCompleted ?? false,
        locked: !progress?.writingCompleted,
        lockedReason: "Complete Writing first",
      },
      {
        name: "Review",
        completed: progress?.reviewCompleted ?? false,
        score: progress?.reviewScore,
        locked: !progress?.speakingCompleted,
        lockedReason: "Complete Speaking first",
      },
    ];

    // If speaking is completed, try to fetch the speaking submission for score
    if (progress?.speakingCompleted) {
      const speakingSubmission = await ctx.db
        .query("speakingSubmissions")
        .withIndex("by_userId_and_unitId", (q) =>
          q.eq("userId", userId).eq("unitId", unit._id)
        )
        .unique();

      const speakingModule = modules.find((m) => m.name === "Speaking");
      if (speakingModule && speakingSubmission?.overallScore) {
        speakingModule.score = speakingSubmission.overallScore;
      }
    }

    return {
      _id: unit._id,
      level: unit.level,
      unitNumber: unit.unitNumber,
      slug: unit.slug,
      topic: unit.topic,
      knowledgeFocus: unit.knowledgeFocus,
      toeflAngle: unit.toeflAngle,
      grammarPoint: unit.grammarPoint,
      modules,
      unitCompleted: progress?.unitCompleted ?? false,
    };
  },
});
