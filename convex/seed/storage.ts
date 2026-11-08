import { requireSeedAdmin } from "../lib/seedAuth";
import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const generateUploadUrl = mutation({
  args: {
    seedAdminKey: v.optional(v.string()),},
  handler: async (ctx, args) => {
    requireSeedAdmin(args.seedAdminKey);
    return await ctx.storage.generateUploadUrl();
  },
});
