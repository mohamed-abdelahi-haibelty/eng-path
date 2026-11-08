"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { getSpeakingPrompt, getWhisperContext } from "../lib/prompts/speaking";
import * as Sentry from "@sentry/node";

// Initialize Sentry for backend actions
if (process.env.SENTRY_DSN && !Sentry.getClient()) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    enabled: !!process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}

type EvalScores = {
  fluency: number;
  coherence: number;
  vocabulary: number;
  grammar: number;
  feedback: string;
  suggestion: string | null;
};

function isValidScores(obj: unknown): obj is EvalScores {
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
      (n) => (n as number) >= 0 && (n as number) <= 5,
    )
  );
}

async function parseEvalResponse(raw: string): Promise<EvalScores> {
  const text = raw.trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (!match) throw new Error("Unparseable DeepSeek response");
    parsed = JSON.parse(match[1]);
  }
  if (!isValidScores(parsed))
    throw new Error("DeepSeek response failed validation");
  return parsed;
}

async function callDeepSeek(
  apiKey: string,
  language: "en" | "fr",
  question: string,
  transcript: string,
  wordCount: number,
  retries = 2,
  delayMs = 500,
): Promise<EvalScores> {
  const prompt = getSpeakingPrompt(language, { question, transcript, wordCount });

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
          temperature: 0.1,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`DeepSeek API error ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = data.choices?.[0]?.message?.content ?? "";
      return await parseEvalResponse(raw);
    } catch (error) {
      if (attempt === retries) throw error;
      const backoffMs = delayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw new Error("DeepSeek call failed after retries");
}

export const evaluateSpeaking = internalAction({
  args: {
    submissionId: v.id("speakingSubmissions"),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.runQuery(
      internal.queries.speaking._submissionById,
      { submissionId: args.submissionId },
    );
    if (!submission) return;

    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const language = (submission.language ?? "en") as "en" | "fr";
    const whisper = getWhisperContext(language);
    const tooShortMessage =
      language === "fr"
        ? "Réponse trop courte pour être évaluée."
        : "Response is too short to evaluate.";

    type TranscriptResult =
      | { ok: true; transcript: string; wordCount: number }
      | { ok: false; err: unknown };

    // Step 1: Transcribe all audio in parallel (Groq has generous limits)
    const transcriptResults: TranscriptResult[] = await Promise.all(
      submission.responses.map(async (response) => {
        try {
          const audioUrl = await ctx.storage.getUrl(response.audioStorageId);
          if (!audioUrl) throw new Error("Audio file not found in storage");

          const audioRes = await fetch(audioUrl);
          const audioBuffer = await audioRes.arrayBuffer();

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
              },
            );
            transcript = (await whisperRes.text()).trim();
          }

          const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
          return { ok: true as const, transcript, wordCount };
        } catch (err) {
          return { ok: false as const, err };
        }
      }),
    );

    // Step 2: Evaluate all responses in parallel — DeepSeek has no per-request rate constraints
    await Promise.all(
      submission.responses.map(async (response, i) => {
        const result = transcriptResults[i];

        try {
          if (!result.ok) throw result.err;

          const { transcript, wordCount } = result;

          if (wordCount < 6) {
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
              },
            );
            return;
          }

          if (!deepseekKey) throw new Error("DeepSeek evaluation unavailable");

          const scores = await callDeepSeek(
            deepseekKey,
            language,
            response.question,
            transcript,
            wordCount,
          );

          if (wordCount < 15) {
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
            },
          );
        } catch (err) {
          console.error(
            `[evaluateSpeaking] response ${response.order} failed`,
            err,
          );

          Sentry.captureException(err, {
            contexts: {
              submission: {
                submissionId: args.submissionId,
                responseOrder: response.order,
                language,
              },
            },
            tags: {
              module: "speaking-evaluation",
              responseOrder: String(response.order),
            },
          });

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
            },
          );
        }
      }),
    );

    await ctx.runMutation(internal.mutations.speaking.finalizeSpeaking, {
      submissionId: args.submissionId,
    });
  },
});
