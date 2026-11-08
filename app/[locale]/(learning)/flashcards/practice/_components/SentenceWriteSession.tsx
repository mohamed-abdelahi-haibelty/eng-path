"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionProgress } from "./SessionProgress";
import type { EvalResult, PracticeCard, SentenceConstraints } from "./types";

const WRITE_COUNT = 8;

const SCORE_LABEL_KEYS: Record<0 | 1 | 2 | 3, string> = {
  3: "score3",
  2: "score2",
  1: "score1",
  0: "score0",
};

const SCORE_COLORS: Record<0 | 1 | 2 | 3, string> = {
  3: "text-state-success",
  2: "text-state-warning",
  1: "text-state-warning",
  0: "text-destructive",
};

function scoreBarColor(value: number): string {
  if (value >= 75) return "oklch(0.716 0.199 145)";
  if (value >= 45) return "oklch(0.769 0.188 75)";
  return "oklch(0.56 0.22 27)";
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setWidth(value);
    });
    return () => cancelAnimationFrame(id);
  }, [value]);

  const color = scoreBarColor(value);

  return (
    <div className="flex items-center gap-3">
      <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground w-16 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-0.75 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-xs font-bold tabular-nums w-7 text-right"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

function ComplianceChip({
  label,
  passed,
}: {
  label: string;
  passed: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[0.6875rem] font-semibold ${
        passed ? "text-state-success" : "text-destructive"
      }`}
    >
      {passed ? (
        <Check className="w-3 h-3 shrink-0" aria-hidden="true" />
      ) : (
        <X className="w-3 h-3 shrink-0" aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

export function SentenceWriteSession({
  cards,
  wordList: wordListProp,
  constraints,
  evaluateFn,
  language,
  onComplete,
}: {
  cards?: PracticeCard[];
  wordList?: PracticeCard[];
  constraints?: SentenceConstraints[];
  evaluateFn: (args: {
    word: string;
    partOfSpeech: string;
    userSentence: string;
    language: "en" | "fr";
    context?: string;
    grammarRequirement?: string;
  }) => Promise<EvalResult>;
  language: "en" | "fr";
  onComplete: (score: number, total: number) => void;
}) {
  const t = useTranslations("flashcards.practice");

  const [wordList] = useState<PracticeCard[]>(() => {
    if (wordListProp && wordListProp.length > 0) return wordListProp;
    const all = cards ?? [];
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, WRITE_COUNT);
  });

  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [evaluation, setEvaluation] = useState<EvalResult | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [passCount, setPassCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const card = wordList[idx];
  const constraint = constraints?.[idx] ?? null;

  useEffect(() => {
    setInput("");
    setEvaluation(null);
    setEvaluating(false);
    textareaRef.current?.focus();
  }, [idx]);

  const handleEvaluate = async () => {
    if (!card || evaluating || input.trim().length < 5) return;
    setEvaluating(true);
    try {
      const result = await evaluateFn({
        word: card.word,
        partOfSpeech: card.partOfSpeech,
        userSentence: input.trim(),
        language,
        context: constraint?.context,
        grammarRequirement: constraint?.grammarRequirement,
      });
      setEvaluation(result);
      if (result.score >= 2) setPassCount((c) => c + 1);
    } catch {
      setEvaluation({
        score: 1,
        feedback: "Could not evaluate. Try again.",
        corrected: null,
        example: null,
      });
    } finally {
      setEvaluating(false);
    }
  };

  const handleNext = () => {
    const nextIdx = idx + 1;
    if (nextIdx >= wordList.length) {
      onComplete(passCount, wordList.length);
    } else {
      setIdx(nextIdx);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      if (!evaluation && !evaluating && input.trim().length >= 5) {
        e.preventDefault();
        handleEvaluate();
      } else if (evaluation) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [evaluation, evaluating, input, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!card) return null;

  const hasScores =
    evaluation &&
    (evaluation.grammarScore !== undefined ||
      evaluation.naturalnessScore !== undefined ||
      evaluation.contextScore !== undefined);

  return (
    <div className="space-y-4">
      <SessionProgress done={idx + 1} total={wordList.length} />

      {/* Word card */}
      <div className="rounded-xl border border-border bg-card px-6 py-5 space-y-3">
        <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
          {t("writeHeading")}
        </p>

        <div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold text-foreground tracking-tight">
              {card.word}
            </span>
            <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
              {card.partOfSpeech}
            </span>
          </div>
          {card.phonetics && (
            <p className="font-mono text-xs text-muted-foreground mt-0.5">
              {card.phonetics}
            </p>
          )}
        </div>

        {card.arabicTranslation && (
          <div className="border-t border-border pt-2.5">
            <p className="text-sm text-muted-foreground" dir="rtl" lang="ar">
              {card.arabicTranslation}
            </p>
          </div>
        )}

        {constraint && (
          <div className="border-t border-border pt-2.5 space-y-2.5">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 border border-border rounded px-2 py-0.5 text-xs font-semibold text-foreground">
                <span className="text-muted-foreground">{t("writeContext")}:</span>
                {constraint.context}
              </span>
              <span className="inline-flex items-center gap-1.5 border border-border rounded px-2 py-0.5 text-xs font-semibold text-foreground">
                <span className="text-muted-foreground">{t("writeGrammar")}:</span>
                {constraint.grammarRequirement}
              </span>
            </div>

            {constraint.collocations.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
                  {t("writeCollocations")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {constraint.collocations.map((c, i) => (
                    <span
                      key={i}
                      className="bg-muted rounded px-2 py-0.5 text-xs text-foreground"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input or evaluation */}
      {!evaluation ? (
        <div className="space-y-3">
          <div>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("writePlaceholder")}
              rows={3}
              className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
            <p className="text-[0.6875rem] text-muted-foreground text-right mt-1">
              {t("writeEnterHint")}
            </p>
          </div>
          <Button
            onClick={handleEvaluate}
            disabled={evaluating || input.trim().length < 5}
            className="w-full"
          >
            {evaluating ? t("evaluating") : t("writeEvaluate")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-4">
            {/* Overall score label */}
            <p
              className={`text-sm font-bold ${SCORE_COLORS[evaluation.score]}`}
            >
              {t(SCORE_LABEL_KEYS[evaluation.score])}
            </p>

            {/* Dimension score bars */}
            {hasScores && (
              <div className="space-y-2.5 pt-0.5">
                {evaluation.grammarScore !== undefined && (
                  <ScoreBar
                    label={t("writeScoreGrammar")}
                    value={evaluation.grammarScore}
                  />
                )}
                {evaluation.naturalnessScore !== undefined && (
                  <ScoreBar
                    label={t("writeScoreNatural")}
                    value={evaluation.naturalnessScore}
                  />
                )}
                {evaluation.contextScore !== undefined && (
                  <ScoreBar
                    label={t("writeScoreContext")}
                    value={evaluation.contextScore}
                  />
                )}
              </div>
            )}

            {/* Compliance chips */}
            {evaluation.compliance && (
              <div className="flex flex-wrap gap-3 pt-0.5 border-t border-border">
                <ComplianceChip
                  label={t("writeComplianceWord")}
                  passed={evaluation.compliance.wordUsed}
                />
                <ComplianceChip
                  label={t("writeComplianceGrammar")}
                  passed={evaluation.compliance.grammarMet}
                />
                <ComplianceChip
                  label={t("writeComplianceContext")}
                  passed={evaluation.compliance.contextMet}
                />
              </div>
            )}

            {/* What was good */}
            {evaluation.whatWasGood && (
              <div className="border-t border-border pt-3 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
                  {t("writeWhatWasGood")}
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {evaluation.whatWasGood}
                </p>
              </div>
            )}

            {/* General feedback (shown when no whatWasGood, or always as corrections context) */}
            {!evaluation.whatWasGood && (
              <div className={hasScores ? "border-t border-border pt-3" : ""}>
                <p className="text-sm text-foreground leading-relaxed">
                  {evaluation.feedback}
                </p>
              </div>
            )}

            {/* Corrections */}
            {evaluation.corrected && (
              <div className="border-t border-border pt-3 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
                  {evaluation.whatWasGood
                    ? t("writeCorrections")
                    : t("correctedVersion")}
                </p>
                {evaluation.whatWasGood && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {evaluation.feedback}
                  </p>
                )}
                <p className="text-sm text-foreground italic leading-relaxed">
                  {evaluation.corrected}
                </p>
              </div>
            )}

            {/* Native alternative */}
            {evaluation.example && (
              <div className="border-t border-border pt-3 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
                  {evaluation.whatWasGood
                    ? t("writeNativeAlt")
                    : t("exampleSentence")}
                </p>
                <p className="text-sm text-foreground italic leading-relaxed">
                  {evaluation.example}
                </p>
              </div>
            )}

            {/* Advanced alternative */}
            {evaluation.advancedAlternative && (
              <div className="border-t border-border pt-3 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
                  {t("writeAdvancedAlt")}
                </p>
                <p className="text-sm text-foreground italic leading-relaxed">
                  {evaluation.advancedAlternative}
                </p>
              </div>
            )}
          </div>

          <Button onClick={handleNext} className="w-full">
            {idx + 1 < wordList.length ? t("next") : t("sessionDone")}
          </Button>
        </div>
      )}
    </div>
  );
}
