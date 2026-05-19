import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";

export type GrammarData = NonNullable<
  FunctionReturnType<typeof api.queries.grammar.grammarBySlug>
>;
export type Exercise = GrammarData["exercises"][number];
export type ExerciseUnion = Exercise["exercise"];

export function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.?!]$/, "");
}

export function checkAnswer(exercise: ExerciseUnion, userAnswer: string): boolean {
  switch (exercise.type) {
    case "fill_in_the_blank":
      return norm(userAnswer) === norm(exercise.answer);
    case "multiple_choice":
      return norm(userAnswer) === norm(exercise.correct);
    case "sentence_transformation":
      return norm(userAnswer) === norm(exercise.answer);
    case "error_correction":
      return norm(userAnswer) === norm(exercise.correct);
    case "build_a_sentence":
      return norm(userAnswer) === norm(exercise.answer);
  }
}

export function getCorrectAnswer(exercise: ExerciseUnion): string {
  switch (exercise.type) {
    case "fill_in_the_blank":
      return exercise.answer;
    case "multiple_choice":
      return `${exercise.correct.toUpperCase()}: ${exercise.options[exercise.correct as keyof typeof exercise.options]}`;
    case "sentence_transformation":
      return exercise.answer;
    case "error_correction":
      return exercise.correct;
    case "build_a_sentence":
      return exercise.answer;
  }
}
