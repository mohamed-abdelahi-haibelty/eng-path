import { v } from "convex/values";
import { mutation } from "../_generated/server";

const levelValidator = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2"),
);

export const seedUnits = mutation({
  args: {
    units: v.array(
      v.object({
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
      const id = await ctx.db.insert("units", unit);
      result.push({ slug: unit.slug, id });
    }
    return result;
  },
});
