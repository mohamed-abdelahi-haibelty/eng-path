import { v } from "convex/values";
import { mutation } from "../_generated/server";

const CURRICULUM_TABLES = [
  "units",
  "grammarModules",
  "grammarExercises",
  "readingModules",
  "listeningModules",
  "writingModules",
  "speakingModules",
  "reviewExercises",
  "vocabulary",
] as const;

type CurriculumTable = (typeof CURRICULUM_TABLES)[number];

export const clearTableBatch = mutation({
  args: {
    table: v.union(
      v.literal("units"),
      v.literal("grammarModules"),
      v.literal("grammarExercises"),
      v.literal("readingModules"),
      v.literal("listeningModules"),
      v.literal("writingModules"),
      v.literal("speakingModules"),
      v.literal("reviewExercises"),
      v.literal("vocabulary"),
    ),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 256;
    const table: CurriculumTable = args.table;
    const rows = await ctx.db.query(table).take(batchSize);

    for (const row of rows) {
      // Delete the audio file from storage when clearing listening modules.
      if (table === "listeningModules") {
        const audioStorageId = (row as { audioStorageId?: string })
          .audioStorageId;
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
