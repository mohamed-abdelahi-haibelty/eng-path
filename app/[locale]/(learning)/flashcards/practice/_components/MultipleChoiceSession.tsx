"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SessionProgress } from "./SessionProgress";
import { shuffle } from "./utils";
import type { PracticeCard } from "./types";

type MCQuestion = {
  card: PracticeCard;
  options: string[];
  correct: string;
  reversed: boolean;
};

function buildMCQuestions(
  cards: PracticeCard[],
  count = 15,
): MCQuestion[] | null {
  const withTranslation = cards.filter((c) => c.arabicTranslation);
  if (withTranslation.length < 4) return null;

  const pool = shuffle(withTranslation);
  const questions: MCQuestion[] = [];

  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const card = pool[i % pool.length];
    const reversed = Math.random() > 0.5 && cards.length > 4;
    const correct = reversed
      ? card.word
      : (card.arabicTranslation ?? card.word);
    const distractors = shuffle(
      withTranslation
        .filter((c) => c !== card)
        .map((c) => (reversed ? c.word : (c.arabicTranslation ?? c.word))),
    ).slice(0, 3);
    const options = shuffle([correct, ...distractors]);
    questions.push({ card, options, correct, reversed });
  }
  return questions;
}

export function MultipleChoiceSession({
  cards,
  onComplete,
}: {
  cards: PracticeCard[];
  onComplete: (score: number, total: number) => void;
}) {
  const t = useTranslations("flashcards.practice");
  const [questions] = useState<MCQuestion[] | null>(() =>
    buildMCQuestions(cards),
  );
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const totalRef = useRef(0);

  useEffect(() => {
    if (questions) totalRef.current = questions.length;
  }, [questions]);

  const question = questions?.[idx];
  const answered = selected !== null;
  const isCorrect = selected === question?.correct;

  const handleSelect = useCallback(
    (opt: string) => {
      if (answered || !question) return;
      setSelected(opt);
      if (opt === question.correct) setCorrectCount((c) => c + 1);
    },
    [answered, question],
  );

  const handleNext = useCallback(() => {
    if (!questions) return;
    const nextIdx = idx + 1;
    if (nextIdx >= questions.length) {
      onComplete(correctCount, questions.length);
    } else {
      setSelected(null);
      setIdx(nextIdx);
    }
  }, [questions, idx, correctCount, selected, question, onComplete]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (!answered && question) {
        const n = parseInt(e.key);
        if (n >= 1 && n <= question.options.length) {
          e.preventDefault();
          handleSelect(question.options[n - 1]);
        }
      } else if (answered && (e.key === "Enter" || e.key === "ArrowRight")) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [answered, question, handleSelect, handleNext]);

  if (!questions || !question) return null;

  return (
    <div className="space-y-4">
      <SessionProgress done={idx + 1} total={questions.length} />

      <div className="rounded-xl border border-border bg-card px-8 py-10 text-center space-y-3">
        <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
          {question.card.partOfSpeech}
        </p>
        {question.reversed ? (
          <p
            className="text-xl font-semibold text-muted-foreground"
            dir="rtl"
            lang="ar"
          >
            {question.card.arabicTranslation}
          </p>
        ) : (
          <p className="text-3xl font-bold text-foreground tracking-tight">
            {question.card.word}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {question.reversed ? t("whichWordMatches") : t("whatDoesThisMean")}
        </p>
      </div>

      <div className="space-y-2">
        {question.options.map((opt, i) => {
          let variant: "default" | "correct" | "wrong" = "default";
          if (answered) {
            if (opt === question.correct) variant = "correct";
            else if (opt === selected) variant = "wrong";
          }

          const classes = {
            default:
              "border-border text-foreground hover:border-foreground/20 hover:bg-muted/40",
            correct: "border-state-success bg-state-success/8 text-foreground",
            wrong: "border-destructive bg-destructive/8 text-foreground",
          }[variant];

          return (
            <button
              key={opt}
              disabled={answered}
              onClick={() => handleSelect(opt)}
              className={[
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-default",
                classes,
              ].join(" ")}
            >
              <span className="font-mono text-[0.7rem] font-bold text-muted-foreground w-4 shrink-0">
                {i + 1}
              </span>
              <span
                className={opt.match(/[؀-ۿ]/) ? "text-right w-full" : ""}
                dir={opt.match(/[؀-ۿ]/) ? "rtl" : undefined}
                lang={opt.match(/[؀-ۿ]/) ? "ar" : undefined}
              >
                {opt}
              </span>
              {variant === "correct" && (
                <CheckCircle2 className="w-4 h-4 text-state-success ml-auto shrink-0" />
              )}
              {variant === "wrong" && (
                <XCircle className="w-4 h-4 text-destructive ml-auto shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="pt-1">
          <p
            className={`text-sm font-semibold mb-3 ${isCorrect ? "text-state-success" : "text-destructive"}`}
          >
            {isCorrect ? t("correct") : t("incorrect")}
          </p>
          <Button onClick={handleNext} className="w-full">
            {idx + 1 < questions.length ? t("next") : t("sessionDone")}
          </Button>
        </div>
      )}
    </div>
  );
}
