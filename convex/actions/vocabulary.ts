"use node";

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

export const prefetchUnitTranslations = action({
  args: { unitId: v.id("units") },
  handler: async (ctx, args) => {
    const apiKey = process.env.LANGBLY_API_KEY;
    if (!apiKey) return null;

    const untranslated = await ctx.runQuery(
      internal.queries.vocabulary._untranslatedByUnit,
      { unitId: args.unitId }
    );

    if (untranslated.length === 0) return null;

    // French vocabulary is seeded with Arabic translations baked in.
    // If any rows lack a translation, leave them — we don't have a
    // FR->AR cloud translation path configured.
    if (untranslated.some((w) => (w.language ?? "en") === "fr")) {
      return null;
    }

    const words = untranslated.map((w) => w.word);

    try {
      const res = await fetch("https://api.langbly.com/language/translate/v2", {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: words,
          source: "en",
          target: "ar",
          format: "text",
          context: "English vocabulary word for language learning",
        }),
      });

      if (!res.ok) return null;

      const data = await res.json() as {
        data: { translations: Array<{ translatedText: string }> };
      };

      const translations = data.data.translations;
      const entries = untranslated
        .map((w, i) => ({
          vocabularyId: w._id,
          translation: translations[i]?.translatedText ?? "",
        }))
        .filter((e) => e.translation !== "");

      if (entries.length === 0) return null;

      await ctx.runMutation(
        internal.mutations.reading.storeArabicTranslationsBatch,
        { entries }
      );
    } catch {
      return null;
    }

    return null;
  },
});
