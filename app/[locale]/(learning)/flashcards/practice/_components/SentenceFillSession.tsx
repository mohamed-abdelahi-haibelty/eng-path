"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SessionProgress } from "./SessionProgress";
import { normalise } from "./utils";
import type { SentenceFillItem } from "./types";

export function SentenceFillSession({
  sentences,
  onComplete,
}: {
  sentences: SentenceFillItem[];
  onComplete: (score: number, total: number) => void;
}) {
  const t = useTranslations("flashcards.practice");
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const item = sentences[idx];

  useEffect(() => {
    inputRef.current?.focus();
  }, [idx]);

  const isCorrect =
    submitted && normalise(input) === normalise(item?.answer ?? "");

  const handleSubmit = () => {
    if (submitted || !item) return;
    setSubmitted(true);
    if (normalise(input) === normalise(item.answer)) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    const nextIdx = idx + 1;
    if (nextIdx >= sentences.length) {
      onComplete(correctCount, sentences.length);
    } else {
      setInput("");
      setSubmitted(false);
      setIdx(nextIdx);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (!submitted) {
          e.preventDefault();
          handleSubmit();
        } else {
          e.preventDefault();
          handleNext();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submitted, input, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null;

  const parts = item.template.split("___");

  return (
    <div className="space-y-4">
      <SessionProgress done={idx + 1} total={sentences.length} />

      <div className="rounded-xl border border-border bg-card px-6 py-8 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("fillHeading")}
        </p>
        <p className="text-base text-foreground leading-relaxed">
          {parts[0]}
          <span
            className={[
              "inline-block min-w-[4rem] border-b-2 mx-1 px-1 text-center font-bold",
              submitted
                ? isCorrect
                  ? "border-state-success text-state-success"
                  : "border-destructive text-destructive"
                : "border-foreground/30 text-muted-foreground",
            ].join(" ")}
          >
            {submitted ? item.answer : input || "___"}
          </span>
          {parts[1]}
        </p>

        {submitted && !isCorrect && (
          <p className="text-xs text-muted-foreground">
            {t("theAnswerWas")}{" "}
            <span className="font-bold text-foreground">{item.answer}</span>
          </p>
        )}
      </div>

      {!submitted ? (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("fillPlaceholder")}
            className="flex-1 rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <Button onClick={handleSubmit} disabled={input.trim().length === 0}>
            {t("submit")}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p
            className={`text-sm font-semibold ${isCorrect ? "text-state-success" : "text-destructive"}`}
          >
            {isCorrect ? t("correct") : t("incorrect")}
          </p>
          <Button onClick={handleNext} className="w-full">
            {idx + 1 < sentences.length ? t("next") : t("sessionDone")}
          </Button>
        </div>
      )}
    </div>
  );
}
