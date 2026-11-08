"use node";

import { action } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

type SentenceFillItem = {
  word: string;
  template: string;
  answer: string;
};

type SentenceConstraints = {
  word: string;
  context: string;
  grammarRequirement: string;
  collocations: string[];
};

type EvalResult = {
  score: 0 | 1 | 2 | 3;
  feedback: string;
  corrected: string | null;
  example: string | null;
  grammarScore?: number;
  naturalnessScore?: number;
  contextScore?: number;
  compliance?: { wordUsed: boolean; grammarMet: boolean; contextMet: boolean };
  whatWasGood?: string | null;
  advancedAlternative?: string | null;
};

async function callDeepSeekJSON(
  apiKey: string,
  prompt: string,
  temperature: number,
  retries = 2,
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
          temperature,
        }),
      });

      if (!res.ok) {
        throw new Error(`DeepSeek API error ${res.status}`);
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

export const generateSentenceFill = action({
  args: {
    words: v.array(v.object({ word: v.string(), partOfSpeech: v.string() })),
    language: v.union(v.literal("en"), v.literal("fr")),
  },
  handler: async (ctx, { words, language }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("DeepSeek not configured");

    const langNote =
      language === "fr"
        ? "Write all sentences in French."
        : "Write all sentences in English.";

    const wordList = words
      .map((w) => `- "${w.word}" (${w.partOfSpeech})`)
      .join("\n");

    const prompt = `You are a language learning assistant. For each word below, write one natural example sentence using the word in context, then replace the word with "___". ${langNote}

Words:
${wordList}

Return a JSON object with a "sentences" array. Each item must have:
- "word": the exact word from the list
- "template": the sentence with the word replaced by "___"
- "answer": the exact word (lowercase, same form as it appears in the list)

Example: {"sentences": [{"word": "ephemeral", "template": "The beauty of cherry blossoms is ___, lasting only a few days.", "answer": "ephemeral"}]}`;

    const raw = await callDeepSeekJSON(apiKey, prompt, 0.4);
    const parsed = parseJSON(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as Record<string, unknown>).sentences)
    ) {
      return [] as SentenceFillItem[];
    }

    return ((parsed as Record<string, unknown>).sentences as unknown[]).filter(
      (item): item is SentenceFillItem => {
        if (!item || typeof item !== "object") return false;
        const i = item as Record<string, unknown>;
        return (
          typeof i.word === "string" &&
          typeof i.template === "string" &&
          typeof i.answer === "string" &&
          (i.template as string).includes("___")
        );
      },
    );
  },
});

export const generateSentenceWriteConstraints = action({
  args: {
    words: v.array(v.object({ word: v.string(), partOfSpeech: v.string() })),
    language: v.union(v.literal("en"), v.literal("fr")),
  },
  handler: async (ctx, { words, language }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("DeepSeek not configured");

    const langName = language === "fr" ? "French" : "English";
    const wordList = words
      .map((w) => `- "${w.word}" (${w.partOfSpeech})`)
      .join("\n");

    const prompt = `You are a ${langName} language teaching assistant. For each word below, assign a context topic, a grammar requirement, and 3-5 common collocations or natural expressions. Write the collocations in ${langName}.

Context topics to choose from: Travel, Family, Work, School, Health, Friendship, Technology, Food, Sports, Shopping, Daily Life
Grammar requirements to choose from: Present tense, Past tense, Future tense, Question form, Negative sentence, First person, Third person

Vary the contexts and grammar requirements across the word list — do not reuse the same combination twice.

Words:
${wordList}

Return a JSON object with a "constraints" array. Each item:
- "word": the exact word from the list
- "context": the chosen context topic (in English)
- "grammarRequirement": the chosen grammar requirement (in English)
- "collocations": array of 3-5 natural expressions or common patterns using the word (in ${langName})

Example: {"constraints": [{"word": "espérer", "context": "Travel", "grammarRequirement": "Future tense", "collocations": ["espérer que", "espérer visiter", "espérer trouver", "espérer une réponse"]}]}`;

    const raw = await callDeepSeekJSON(apiKey, prompt, 0.6);
    const parsed = parseJSON(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as Record<string, unknown>).constraints)
    ) {
      return [] as SentenceConstraints[];
    }

    return ((parsed as Record<string, unknown>).constraints as unknown[]).filter(
      (item): item is SentenceConstraints => {
        if (!item || typeof item !== "object") return false;
        const i = item as Record<string, unknown>;
        return (
          typeof i.word === "string" &&
          typeof i.context === "string" &&
          typeof i.grammarRequirement === "string" &&
          Array.isArray(i.collocations)
        );
      },
    );
  },
});

export const evaluateSentence = action({
  args: {
    word: v.string(),
    partOfSpeech: v.string(),
    userSentence: v.string(),
    language: v.union(v.literal("en"), v.literal("fr")),
    context: v.optional(v.string()),
    grammarRequirement: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { word, partOfSpeech, userSentence, language, context, grammarRequirement },
  ) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("DeepSeek not configured");

    const langName = language === "fr" ? "French" : "English";
    const hasConstraints = Boolean(context && grammarRequirement);

    const constraintBlock = hasConstraints
      ? `
The learner was also given these constraints:
- Context topic: ${context}
- Grammar requirement: ${grammarRequirement}

Please also evaluate:
- grammarScore (0-100): verb conjugation, agreement, syntax, word order
- naturalnessScore (0-100): would a native speaker phrase it this way?
- contextScore (0-100): how well the sentence fits the "${context}" context
- compliance: { "wordUsed": bool, "grammarMet": bool, "contextMet": bool }
- whatWasGood: 1-2 sentences in ${langName} on what the learner did well
- advancedAlternative: a more sophisticated sentence using "${word}" in ${langName}`
      : "";

    const returnSchema = hasConstraints
      ? `{"score": <0-3>, "grammarScore": <0-100>, "naturalnessScore": <0-100>, "contextScore": <0-100>, "feedback": "<1-2 sentence evaluation in ${langName}>", "whatWasGood": "<what went well, in ${langName}>", "corrected": "<improved version in ${langName}, or null if score is 3>", "example": "<a natural example sentence using '${word}' in ${langName}>", "advancedAlternative": "<more sophisticated sentence in ${langName}>", "compliance": {"wordUsed": <bool>, "grammarMet": <bool>, "contextMet": <bool>}}`
      : `{"score": <0-3>, "feedback": "<1-2 sentence evaluation in ${langName}>", "corrected": "<improved version in ${langName}, or null if score is 3>", "example": "<a natural example sentence using '${word}' in ${langName}>"}`;

    const prompt = `You are a ${langName} language teacher evaluating a learner's sentence. Write ALL text fields in ${langName}.

The learner was asked to use the word "${word}" (${partOfSpeech}) in a ${langName} sentence. They wrote:
"${userSentence}"

Score the sentence 0 to 3:
- 3: Perfect — correct word usage, natural phrasing, no errors
- 2: Good — correct usage but minor grammar or phrasing issues
- 1: Weak — the word is attempted but context or grammar is significantly wrong
- 0: Incorrect — word is misused or sentence does not make sense
${constraintBlock}

Also write one natural, varied example sentence using "${word}" correctly in ${langName} that the learner can study.

Return JSON only:
${returnSchema}`;

    const raw = await callDeepSeekJSON(apiKey, prompt, 0.1);
    const parsed = parseJSON(raw);

    const fallback: EvalResult = {
      score: 1,
      feedback: "Could not evaluate. Try again.",
      corrected: null,
      example: null,
    };

    if (!parsed || typeof parsed !== "object") return fallback;

    const p = parsed as Record<string, unknown>;
    const rawScore = p.score;
    const score: 0 | 1 | 2 | 3 =
      typeof rawScore === "number" && rawScore >= 0 && rawScore <= 3
        ? (Math.round(rawScore) as 0 | 1 | 2 | 3)
        : 1;

    const clamp = (n: unknown): number | undefined => {
      if (typeof n !== "number") return undefined;
      return Math.min(100, Math.max(0, Math.round(n)));
    };

    const compliance =
      hasConstraints && p.compliance && typeof p.compliance === "object"
        ? {
            wordUsed:
              Boolean((p.compliance as Record<string, unknown>).wordUsed),
            grammarMet: Boolean(
              (p.compliance as Record<string, unknown>).grammarMet,
            ),
            contextMet: Boolean(
              (p.compliance as Record<string, unknown>).contextMet,
            ),
          }
        : undefined;

    return {
      score,
      feedback:
        typeof p.feedback === "string" ? p.feedback : "No feedback available.",
      corrected:
        typeof p.corrected === "string" && p.corrected.length > 0
          ? p.corrected
          : null,
      example:
        typeof p.example === "string" && p.example.length > 0
          ? p.example
          : null,
      grammarScore: clamp(p.grammarScore),
      naturalnessScore: clamp(p.naturalnessScore),
      contextScore: clamp(p.contextScore),
      compliance,
      whatWasGood:
        typeof p.whatWasGood === "string" && p.whatWasGood.length > 0
          ? p.whatWasGood
          : null,
      advancedAlternative:
        typeof p.advancedAlternative === "string" &&
        p.advancedAlternative.length > 0
          ? p.advancedAlternative
          : null,
    } satisfies EvalResult;
  },
});
