import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { v } from "convex/values";

export const listSentences = query({
  args: {
    language: v.union(v.literal("en"), v.literal("fr")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("savedSentences")
      .withIndex("by_user_and_language", (q) =>
        q.eq("userId", userId).eq("language", args.language)
      )
      .order("desc")
      .take(200);
  },
});

export const getDueSentences = query({
  args: {
    language: v.union(v.literal("en"), v.literal("fr")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const now = Date.now();

    // Sentences with no FSRS state yet (never reviewed) — treat as due
    const allForLanguage = await ctx.db
      .query("savedSentences")
      .withIndex("by_user_and_language", (q) =>
        q.eq("userId", userId).eq("language", args.language)
      )
      .take(200);

    return allForLanguage
      .filter((s) => s.aiStatus === "done" && (!s.state || s.state === "new" || (s.due !== undefined && s.due <= now)))
      .slice(0, 30);
  },
});

export const countSentences = query({
  args: {
    language: v.union(v.literal("en"), v.literal("fr")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { total: 0, due: 0 };

    const now = Date.now();
    const all = await ctx.db
      .query("savedSentences")
      .withIndex("by_user_and_language", (q) =>
        q.eq("userId", userId).eq("language", args.language)
      )
      .take(200);

    const due = all.filter(
      (s) =>
        s.aiStatus === "done" &&
        (!s.state || s.state === "new" || (s.due !== undefined && s.due <= now))
    ).length;

    return { total: all.length, due };
  },
});
