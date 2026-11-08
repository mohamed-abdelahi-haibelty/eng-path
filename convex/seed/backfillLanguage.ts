import { requireSeedAdmin } from "../lib/seedAuth";
import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

const TABLE_VALIDATOR = v.union(
  v.literal("units"),
  v.literal("grammarModules"),
  v.literal("grammarExercises"),
  v.literal("readingModules"),
  v.literal("listeningModules"),
  v.literal("writingModules"),
  v.literal("speakingModules"),
  v.literal("reviewExercises"),
  v.literal("vocabulary"),
);

/**
 * One-time backfill: sets language: "en" on rows seeded before the language
 * field was introduced. Process one table per call to stay under the 4096-read
 * limit. Returns { patched, hasMore } so you can loop until hasMore is false.
 */
export const backfillTableBatch = mutation({
  args: {
    seedAdminKey: v.optional(v.string()),
    table: TABLE_VALIDATOR,
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    requireSeedAdmin(args.seedAdminKey);
    const limit = args.batchSize ?? 200;
    const rows = await ctx.db.query(args.table).take(limit * 2);
    let patched = 0;
    for (const row of rows) {
      if (!row.language) {
        await ctx.db.patch(row._id, { language: "en" });
        patched++;
      }
    }
    // If we got a full batch there may be more rows without language.
    const hasMore = patched === limit * 2;
    return { patched, hasMore };
  },
});

export const countUnits = query({
  args: {
    seedAdminKey: v.optional(v.string()),},
  handler: async (ctx, args) => {
    requireSeedAdmin(args.seedAdminKey);
    const all = await ctx.db.query("units").take(300);
    const en = all.filter((u) => u.language === "en").length;
    const fr = all.filter((u) => u.language === "fr").length;
    const none = all.filter((u) => !u.language).length;
    return { total: all.length, en, fr, none };
  },
});
