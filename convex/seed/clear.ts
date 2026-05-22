import { v } from "convex/values";
import { mutation } from "../_generated/server";

const tableValidator = v.union(
  v.literal("units"),
  v.literal("grammarModules"),
  v.literal("grammarExercises"),
  v.literal("readingModules"),
  v.literal("listeningModules"),
  v.literal("writingModules"),
  v.literal("speakingModules"),
  v.literal("reviewExercises"),
  v.literal("vocabulary"),
  v.literal("conjugaisonModules"),
  v.literal("orthographeModules"),
);

const languageValidator = v.union(v.literal("en"), v.literal("fr"));

// Full clear — used by the English seed to wipe everything before re-seeding.
export const clearTableBatch = mutation({
  args: {
    table: tableValidator,
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 256;
    const rows = await ctx.db.query(args.table).take(batchSize);

    for (const row of rows) {
      if (args.table === "listeningModules") {
        const audioStorageId = (row as { audioStorageId?: string }).audioStorageId;
        if (audioStorageId) {
          try {
            await ctx.storage.delete(audioStorageId as never);
          } catch {
            // ignore — file may have been removed already
          }
        }
      }
      await ctx.db.delete(row._id);
    }

    return { deleted: rows.length, hasMore: rows.length === batchSize };
  },
});

// Language-scoped clear — used by the French seed to wipe only French rows.
// Uses a JS-level filter (full scan) since module tables have no language index.
// Acceptable for an offline seed operation.
export const clearFrenchBatch = mutation({
  args: {
    table: tableValidator,
    language: languageValidator,
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 128;

    // conjugaisonModules and orthographeModules are French-only — clear all.
    const frenchOnlyTables = ["conjugaisonModules", "orthographeModules"] as const;
    const isFrenchOnly = (frenchOnlyTables as readonly string[]).includes(args.table);

    let rows;
    if (isFrenchOnly) {
      rows = await ctx.db.query(args.table).take(batchSize);
    } else {
      rows = await ctx.db
        .query(args.table)
        .filter((q) => q.eq(q.field("language"), args.language))
        .take(batchSize);
    }

    for (const row of rows) {
      if (args.table === "listeningModules") {
        const audioStorageId = (row as { audioStorageId?: string }).audioStorageId;
        if (audioStorageId) {
          try {
            await ctx.storage.delete(audioStorageId as never);
          } catch {
            // ignore
          }
        }
      }
      await ctx.db.delete(row._id);
    }

    return { deleted: rows.length, hasMore: rows.length > 0 };
  },
});
