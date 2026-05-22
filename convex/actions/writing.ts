"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";
import { getWritingPrompt } from "../lib/prompts/writing";

export const evaluateWriting = internalAction({
  args: {
    submissionId: v.id("writingSubmissions"),
    unitId: v.id("units"),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.runQuery(
      internal.queries.writing._submissionById,
      { submissionId: args.submissionId },
    );

    if (!submission) {
      await ctx.runMutation(internal.mutations.writing.markWritingFailed, {
        submissionId: args.submissionId,
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      await ctx.runMutation(internal.mutations.writing.markWritingFailed, {
        submissionId: args.submissionId,
      });
      return;
    }

    const { writingModule, unit, text } = submission;
    const level = unit.level;
    const language = (unit.language ?? "en") as "en" | "fr";

    const prompt = getWritingPrompt(language, {
      prompt: writingModule.prompt,
      rubric: writingModule.rubric,
      level,
      text,
    });

    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const raw = response.text ?? "";

      type EvalResult = {
        overallScore: number;
        dimensions: {
          taskResponse: number;
          coherence: number;
          vocabulary: number;
          grammar: number;
        };
        strengths: string[];
        weaknesses: string[];
        modelRewrite: string;
      };

      let parsed: EvalResult;
      try {
        parsed = JSON.parse(raw.trim()) as EvalResult;
      } catch {
        const match = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
        if (!match) throw new Error("Unparseable response from model");
        parsed = JSON.parse(match[1]) as EvalResult;
      }

      await ctx.runMutation(internal.mutations.writing.storeWritingFeedback, {
        submissionId: args.submissionId,
        unitId: args.unitId,
        overallScore: parsed.overallScore,
        dimensions: parsed.dimensions,
        strengths: parsed.strengths,
        weaknesses: parsed.weaknesses,
        modelRewrite: parsed.modelRewrite,
      });
    } catch (err) {
      console.error("[evaluateWriting] failed:", err);
      await ctx.runMutation(internal.mutations.writing.markWritingFailed, {
        submissionId: args.submissionId,
      });
    }
  },
});
