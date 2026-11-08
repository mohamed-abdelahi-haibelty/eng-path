"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

type EnrichmentResult = {
  keyExpression: string;
  grammarNote: string;
  paraphrases: string[];
  usageContexts: string[];
  cefrLevel: string;
  blankWord: string;
};

function isValidEnrichment(obj: unknown): obj is EnrichmentResult {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.keyExpression === "string" &&
    typeof o.grammarNote === "string" &&
    Array.isArray(o.paraphrases) &&
    (o.paraphrases as unknown[]).every((p) => typeof p === "string") &&
    Array.isArray(o.usageContexts) &&
    (o.usageContexts as unknown[]).every((c) => typeof c === "string") &&
    typeof o.cefrLevel === "string" &&
    typeof o.blankWord === "string"
  );
}

function parseJSON(raw: string): unknown {
  const text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }
}

async function callDeepSeekJSON(
  apiKey: string,
  prompt: string,
  retries = 2
): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`DeepSeek API error ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return data.choices?.[0]?.message?.content ?? "";
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
  throw new Error("DeepSeek call failed after retries");
}

function buildPrompt(text: string, language: "en" | "fr"): string {
  const langLabel = language === "fr" ? "French" : "English";
  return `You are a language learning assistant. Analyse this ${langLabel} sentence and return a JSON object.

Sentence: "${text}"

Return ONLY a JSON object with exactly these fields:
- keyExpression (string): the single most important phrase or idiom in the sentence worth memorising (2-6 words). If no idiom, pick the most useful collocated phrase.
- grammarNote (string): one concise sentence explaining the most notable grammar structure used (max 15 words).
- paraphrases (array of 2 strings): two alternative ways to express the same idea, natural and idiomatic.
- usageContexts (array of 2 strings): two real everyday situations where someone would say this sentence (each max 10 words, start with a verb, e.g. "Praising a colleague's dedication").
- cefrLevel (string): estimated CEFR level of the sentence (A1, A2, B1, B2, C1, or C2).
- blankWord (string): the single word in the sentence that would make the best fill-in-the-blank exercise — choose the word that is most instructive to learn, not a function word like "the" or "is".

Respond with valid JSON only.`;
}

export const enrichSentence = internalAction({
  args: {
    sentenceId: v.id("savedSentences"),
    text: v.string(),
    language: v.union(v.literal("en"), v.literal("fr")),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      await ctx.runMutation(internal.mutations.sentences.storeEnrichment, {
        sentenceId: args.sentenceId,
        status: "error",
      });
      return;
    }

    try {
      const prompt = buildPrompt(args.text, args.language);
      const raw = await callDeepSeekJSON(apiKey, prompt);
      const parsed = parseJSON(raw);

      if (!isValidEnrichment(parsed)) {
        throw new Error("Enrichment response failed validation");
      }

      await ctx.runMutation(internal.mutations.sentences.storeEnrichment, {
        sentenceId: args.sentenceId,
        status: "done",
        keyExpression: parsed.keyExpression,
        grammarNote: parsed.grammarNote,
        paraphrases: parsed.paraphrases,
        usageContexts: parsed.usageContexts,
        cefrLevel: parsed.cefrLevel,
        blankWord: parsed.blankWord,
      });
    } catch {
      await ctx.runMutation(internal.mutations.sentences.storeEnrichment, {
        sentenceId: args.sentenceId,
        status: "error",
      });
    }
  },
});
