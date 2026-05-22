"use client";

import type { Exercise } from "./grammar-types";
import { getCorrectAnswer } from "./grammar-types";
import {
  FillInTheBlank,
  MultipleChoice,
  SentenceTransformation,
  ErrorCorrection,
  BuildASentence,
} from "./ExerciseInputs";

export function ExerciseCard({
  exercise,
  index,
  answer,
  onAnswer,
  submitted,
  isCorrect,
}: {
  exercise: Exercise;
  index: number;
  answer: string;
  onAnswer: (v: string) => void;
  submitted: boolean;
  isCorrect: boolean | null;
}) {
  const ex = exercise.exercise;
  const numStr = String(index + 1).padStart(2, "0");

  const cardBorderClass =
    submitted && isCorrect !== null
      ? isCorrect
        ? "border-state-success"
        : "border-destructive"
      : "border-border";

  return (
    <div
      className={`rounded-xl border bg-card p-5 transition-colors ${cardBorderClass}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 flex-1">
          <span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground mt-0.5 pt-px">
            {numStr}
          </span>
          <p className="text-sm text-foreground leading-6">{exercise.instruction}</p>
        </div>
        {submitted && isCorrect !== null && (
          <span
            className={`shrink-0 text-xs font-semibold mt-0.5 ${
              isCorrect ? "text-state-success" : "text-destructive"
            }`}
          >
            {isCorrect ? "Correct" : "Wrong"}
          </span>
        )}
      </div>

      <div className="ml-7">
        {ex.type === "fill_in_the_blank" && (
          <FillInTheBlank
            exercise={ex}
            value={answer}
            onChange={onAnswer}
            disabled={submitted}
          />
        )}
        {ex.type === "multiple_choice" && (
          <MultipleChoice
            exercise={ex}
            value={answer}
            onChange={onAnswer}
            disabled={submitted}
          />
        )}
        {ex.type === "sentence_transformation" && (
          <SentenceTransformation
            exercise={ex}
            value={answer}
            onChange={onAnswer}
            disabled={submitted}
          />
        )}
        {ex.type === "error_correction" && (
          <ErrorCorrection
            exercise={ex}
            value={answer}
            onChange={onAnswer}
            disabled={submitted}
          />
        )}
        {ex.type === "build_a_sentence" && (
          <BuildASentence
            exercise={ex}
            value={answer}
            onChange={onAnswer}
            disabled={submitted}
          />
        )}

        {submitted && isCorrect !== null && !isCorrect && (
          <div className="mt-3 pt-3 border-t border-border space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Correct answer
            </p>
            <p className="text-sm text-foreground">{getCorrectAnswer(ex)}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-5">
              {ex.explanation}
            </p>
          </div>
        )}
        {submitted && isCorrect && (
          <div className="mt-3 pt-3 border-t border-state-success/20">
            <p className="text-xs text-muted-foreground leading-5">
              {ex.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
