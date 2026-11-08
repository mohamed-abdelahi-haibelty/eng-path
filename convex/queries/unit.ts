import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { v } from "convex/values";

const LEVEL_VALIDATOR = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2"),
);

export type ModuleKey =
  | "grammar"
  | "conjugaison"
  | "orthographe"
  | "reading"
  | "listening"
  | "writing"
  | "speaking"
  | "review";

interface Module {
  key: ModuleKey;
  completed: boolean;
  score?: number;
  locked: boolean;
  lockedReason?: string;
}

const PREREQ_SCORE = 70;
const READING_GATE_SCORE = 60;

export const unitBySlug = query({
  args: { level: LEVEL_VALIDATOR, slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const unit = await ctx.db
      .query("units")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!unit || unit.level !== args.level) return null;

    const language = unit.language ?? "en";

    const progress = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", userId).eq("unitId", unit._id),
      )
      .unique();

    const grammarPassed =
      !!progress?.grammarCompleted &&
      (progress?.grammarScore ?? 0) >= PREREQ_SCORE;
    const conjugaisonPassed =
      !!progress?.conjugaisonCompleted &&
      (progress?.conjugaisonScore ?? 0) >= PREREQ_SCORE;
    const orthographePassed =
      !!progress?.orthographeCompleted &&
      (progress?.orthographeScore ?? 0) >= PREREQ_SCORE;

    // Reading prerequisite differs by language.
    const readingUnlocked =
      language === "fr"
        ? orthographePassed
        : grammarPassed;
    const readingLockedReason =
      language === "fr"
        ? !progress?.orthographeCompleted
          ? "complete-orthographe"
          : "orthographe-threshold"
        : !progress?.grammarCompleted
          ? "complete-grammar"
          : "grammar-threshold";

    const modules: Module[] = [];

    modules.push({
      key: "grammar",
      completed: progress?.grammarCompleted ?? false,
      score: progress?.grammarScore,
      locked: false,
    });

    if (language === "fr") {
      modules.push({
        key: "conjugaison",
        completed: progress?.conjugaisonCompleted ?? false,
        score: progress?.conjugaisonScore,
        locked: !grammarPassed,
        lockedReason: !progress?.grammarCompleted
          ? "complete-grammar"
          : "grammar-threshold",
      });
      modules.push({
        key: "orthographe",
        completed: progress?.orthographeCompleted ?? false,
        score: progress?.orthographeScore,
        locked: !conjugaisonPassed,
        lockedReason: !progress?.conjugaisonCompleted
          ? "complete-conjugaison"
          : "conjugaison-threshold",
      });
    }

    modules.push({
      key: "reading",
      completed: progress?.readingCompleted ?? false,
      score: progress?.readingScore,
      locked: !readingUnlocked,
      lockedReason: readingLockedReason,
    });

    modules.push({
      key: "listening",
      completed: progress?.listeningCompleted ?? false,
      score: progress?.listeningScore,
      locked:
        !progress?.readingCompleted ||
        (progress?.readingScore ?? 0) < READING_GATE_SCORE,
      lockedReason: "complete-reading",
    });

    modules.push({
      key: "writing",
      completed: progress?.writingCompleted ?? false,
      locked: !progress?.listeningCompleted,
      lockedReason: "complete-listening",
    });

    modules.push({
      key: "speaking",
      completed: progress?.speakingCompleted ?? false,
      locked: !progress?.writingCompleted,
      lockedReason: "complete-writing",
    });

    modules.push({
      key: "review",
      completed: progress?.reviewCompleted ?? false,
      score: progress?.reviewScore,
      locked: !progress?.speakingCompleted,
      lockedReason: "complete-speaking",
    });

    // If speaking is completed, try to fetch the speaking submission for score.
    if (progress?.speakingCompleted) {
      const speakingSubmission = await ctx.db
        .query("speakingSubmissions")
        .withIndex("by_userId_and_unitId", (q) =>
          q.eq("userId", userId).eq("unitId", unit._id),
        )
        .unique();

      const speakingModule = modules.find((m) => m.key === "speaking");
      if (speakingModule && speakingSubmission?.overallScore) {
        speakingModule.score = speakingSubmission.overallScore;
      }
    }

    return {
      _id: unit._id,
      language,
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
