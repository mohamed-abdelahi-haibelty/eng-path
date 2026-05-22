import { v } from "convex/values";
import { mutation } from "../_generated/server";

const levelValidator = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2"),
);

const languageValidator = v.optional(v.union(v.literal("en"), v.literal("fr")));

export const seedUnits = mutation({
  args: {
    units: v.array(
      v.object({
        language: languageValidator,
        level: levelValidator,
        unitNumber: v.number(),
        slug: v.string(),
        topic: v.string(),
        knowledgeFocus: v.string(),
        toeflAngle: v.string(),
        grammarPoint: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const result: { slug: string; id: string }[] = [];
    for (const unit of args.units) {
      const id = await ctx.db.insert("units", {
        ...unit,
        language: unit.language ?? "en",
      });
      result.push({ slug: unit.slug, id });
    }
    return result;
  },
});
