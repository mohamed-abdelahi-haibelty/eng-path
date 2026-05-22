"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";
import { getSpeakingPrompt, getWhisperContext } from "../lib/prompts/speaking";

type GeminiScores = {
  fluency: number;
  coherence: number;
  vocabulary: number;
  grammar: number;
  feedback: string;
  suggestion: string | null;
};

function isValidScores(obj: unknown): obj is GeminiScores {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.fluency === "number" &&
    typeof o.coherence === "number" &&
    typeof o.vocabulary === "number" &&
    typeof o.grammar === "number" &&
    typeof o.feedback === "string" &&
    (o.suggestion === null || typeof o.suggestion === "string") &&
    [o.fluency, o.coherence, o.vocabulary, o.grammar].every(
      (n) => (n as number) >= 0 && (n as number) <= 5
    )
  );
}

async function parseGeminiResponse(raw: string): Promise<GeminiScores> {
  const text = raw.trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (!match) throw new Error("Unparseable Gemini response");
    parsed = JSON.parse(match[1]);
  }
  if (!isValidScores(parsed)) throw new Error("Gemini response failed validation");
  return parsed;
}

async function callGemini(
  apiKey: string,
  language: "en" | "fr",
  question: string,
  transcript: string,
  wordCount: number
): Promise<GeminiScores> {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = getSpeakingPrompt(language, { question, transcript, wordCount });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: { responseMimeType: "application/json", temperature: 0.1 },
  });

  return await parseGeminiResponse(response.text ?? "");
}

export const evaluateSpeaking = internalAction({
  args: {
    submissionId: v.id("speakingSubmissions"),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.runQuery(
      internal.queries.speaking._submissionById,
      { submissionId: args.submissionId }
    );
    if (!submission) return;

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const language = (submission.language ?? "en") as "en" | "fr";
    const whisper = getWhisperContext(language);
    const tooShortMessage =
      language === "fr"
        ? "Réponse trop courte pour être évaluée."
        : "Response is too short to evaluate.";

    for (const response of submission.responses) {
      try {
        // 1. Get temporary audio URL from storage
        const audioUrl = await ctx.storage.getUrl(response.audioStorageId);
        if (!audioUrl) throw new Error("Audio file not found in storage");

        // 2. Download audio blob
        const audioRes = await fetch(audioUrl);
        const audioBuffer = await audioRes.arrayBuffer();

        // 3. Transcribe via Groq Whisper
        let transcript = "";
        if (groqKey) {
          const file = new File([audioBuffer], "audio.webm", {
            type: "audio/webm",
          });
          const form = new FormData();
          form.append("file", file);
          form.append("model", "whisper-large-v3");
          form.append("language", whisper.languageCode);
          form.append("response_format", "text");
          form.append("temperature", "0.0");
          form.append("prompt", whisper.prompt);

          const whisperRes = await fetch(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            {
              method: "POST",
              headers: { Authorization: `Bearer ${groqKey}` },
              body: form,
            }
          );
          transcript = (await whisperRes.text()).trim();
        }

        // 4. Word count gate
        const words = transcript
          .trim()
          .split(/\s+/)
          .filter(Boolean);
        const wordCount = words.length;

        if (wordCount < 10) {
          await ctx.runMutation(
            internal.mutations.speaking.storeResponseResult,
            {
              submissionId: args.submissionId,
              order: response.order,
              transcript,
              wordCount,
              scores: { fluency: 0, coherence: 0, vocabulary: 0, grammar: 0 },
              totalScore: 0,
              feedback: tooShortMessage,
              suggestion: null,
              evaluationStatus: "done",
            }
          );
          continue;
        }

        // 5. Gemini evaluation with 1 retry
        let scores: GeminiScores | null = null;
        if (geminiKey) {
          try {
            scores = await callGemini(
              geminiKey,
              language,
              response.question,
              transcript,
              wordCount
            );
          } catch {
            scores = await callGemini(
              geminiKey,
              language,
              response.question,
              transcript,
              wordCount
            );
          }
        }

        if (!scores) throw new Error("Gemini evaluation unavailable");

        // Apply fluency cap for very short responses
        if (wordCount < 25) {
          scores.fluency = Math.min(scores.fluency, 2);
        }

        const totalScore =
          scores.fluency + scores.coherence + scores.vocabulary + scores.grammar;

        await ctx.runMutation(
          internal.mutations.speaking.storeResponseResult,
          {
            submissionId: args.submissionId,
            order: response.order,
            transcript,
            wordCount,
            scores: {
              fluency: scores.fluency,
              coherence: scores.coherence,
              vocabulary: scores.vocabulary,
              grammar: scores.grammar,
            },
            totalScore,
            feedback: scores.feedback,
            suggestion: scores.suggestion,
            evaluationStatus: "done",
          }
        );
      } catch (err) {
        console.error(
          `[evaluateSpeaking] response ${response.order} failed:`,
          err
        );
        await ctx.runMutation(
          internal.mutations.speaking.storeResponseResult,
          {
            submissionId: args.submissionId,
            order: response.order,
            transcript: "",
            wordCount: 0,
            scores: null,
            totalScore: null,
            feedback: null,
            suggestion: null,
            evaluationStatus: "error",
          }
        );
      }
    }

    await ctx.runMutation(internal.mutations.speaking.finalizeSpeaking, {
      submissionId: args.submissionId,
    });
  },
});
