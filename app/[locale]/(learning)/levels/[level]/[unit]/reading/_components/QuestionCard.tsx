"use client";

import { CheckCircle2, XCircle } from "lucide-react";

interface Option {
  key: string;
  label: string;
}

interface QuestionCardProps {
  index: number;
  question: string;
  options: Option[];
  selected: string | null;
  onSelect: (key: string) => void;
  submitted: boolean;
  correct: string;
  explanation: string;
}

export function QuestionCard({
  index,
  question,
  options,
  selected,
  onSelect,
  submitted,
  correct,
  explanation,
}: QuestionCardProps) {
  const isCorrect = submitted && selected === correct;
  const isWrong = submitted && selected !== null && selected !== correct;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground leading-snug">
        <span className="font-mono text-muted-foreground mr-2">
          {String(index + 1).padStart(2, "0")}.
        </span>
        {question}
      </p>

      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = selected === opt.key;
          const isThisCorrect = submitted && opt.key === correct;
          const isThisWrong = submitted && isSelected && opt.key !== correct;

          return (
            <button
              key={opt.key}
              onClick={() => !submitted && onSelect(opt.key)}
              disabled={submitted}
              className={[
                "w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                !submitted && !isSelected && "border-border text-foreground hover:bg-muted",
                !submitted && isSelected && "border-foreground bg-muted text-foreground",
                isThisCorrect && "border-state-success bg-state-success/8 text-foreground",
                isThisWrong && "border-destructive bg-destructive/8 text-foreground",
                submitted && !isSelected && opt.key !== correct && "border-border text-muted-foreground",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="inline-flex items-center gap-3 w-full">
                <span className="text-xs font-bold uppercase text-muted-foreground w-4 shrink-0">
                  {opt.key}
                </span>
                <span className="flex-1">{opt.label}</span>
                {isThisCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-state-success shrink-0" />
                )}
                {isThisWrong && (
                  <XCircle className="w-4 h-4 text-destructive shrink-0" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {submitted && (
        <p className="text-xs text-muted-foreground leading-relaxed bg-muted rounded-lg px-3 py-2">
          {explanation}
        </p>
      )}
    </div>
  );
}
