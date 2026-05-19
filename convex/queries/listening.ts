import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { v } from "convex/values";

const LEVEL_VALIDATOR = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2")
);

export const listeningBySlug = query({
  args: { level: LEVEL_VALIDATOR, slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const unit = await ctx.db
      .query("units")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!unit || unit.level !== args.level) return null;

    const listeningModule = await ctx.db
      .query("listeningModules")
      .withIndex("by_unit", (q) => q.eq("unitId", unit._id))
      .unique();

    if (!listeningModule) return null;

    const audioUrl = await ctx.storage.getUrl(listeningModule.audioStorageId);
    if (!audioUrl) return null;

    const progress = await ctx.db
      .query("unitProgress")
      .withIndex("by_userId_and_unitId", (q) =>
        q.eq("userId", userId).eq("unitId", unit._id)
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
        _id: listeningModule._id,
        title: listeningModule.title,
        questions: listeningModule.questions,
      },
      audioUrl,
      progress: {
        listeningCompleted: progress?.listeningCompleted ?? false,
        listeningScore: progress?.listeningScore,
        listeningListensUsed: progress?.listeningListensUsed ?? 0,
      },
    };
  },
});
