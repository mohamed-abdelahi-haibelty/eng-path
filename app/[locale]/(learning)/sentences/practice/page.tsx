"use client";

import { use, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { isLocale } from "@/i18n/routing";
import { useAction } from "@/hooks/use-action";
import { BackLink } from "@/components/ui/back-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  CheckCircle,
  XCircle,
  ArrowRight,
  Loader2,
  RotateCcw,
} from "lucide-react";

type Rating = "again" | "hard" | "good" | "easy";

type DueSentence = {
  _id: Id<"savedSentences">;
  text: string;
  source: string;
  note?: string;
  keyExpression?: string;
  grammarNote?: string;
  usageContexts?: string[];
  cefrLevel?: string;
  blankWord?: string;
  state?: string;
  reps?: number;
};

type ExerciseMode = "fill_blank" | "scramble" | "recall";

const RATING_COLORS: Record<Rating, string> = {
  again:
    "border-destructive/40 hover:border-destructive hover:bg-destructive/8 text-foreground",
  hard: "border-state-warning/40 hover:border-state-warning hover:bg-state-warning/8 text-foreground",
  good: "border-state-success/40 hover:border-state-success hover:bg-state-success/8 text-foreground",
  easy: "border-border hover:border-foreground/40 hover:bg-muted text-foreground",
};

const RATINGS: { value: Rating; label: string; shortcut: string }[] = [
  { value: "again", label: "Again", shortcut: "1" },
  { value: "hard", label: "Hard", shortcut: "2" },
  { value: "good", label: "Good", shortcut: "3" },
  { value: "easy", label: "Easy", shortcut: "4" },
];

function chooseMode(sentence: DueSentence, index: number): ExerciseMode {
  if (sentence.blankWord) {
    const modes: ExerciseMode[] = ["fill_blank", "scramble", "recall"];
    return modes[index % 3];
  }
  const modes: ExerciseMode[] = ["scramble", "recall"];
  return modes[index % 2];
}

function tokenize(text: string): string[] {
  return text.match(/[\w''-]+|[^\w\s]/g) ?? text.split(" ");
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9\s']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreRecall(attempt: string, original: string): 0 | 1 | 2 {
  const a = normalize(attempt);
  const o = normalize(original);
  if (a === o) return 2;
  const aWords = new Set(a.split(" ").filter(Boolean));
  const oWords = o.split(" ").filter(Boolean);
  const matched = oWords.filter((w) => aWords.has(w)).length;
  const ratio = oWords.length > 0 ? matched / oWords.length : 0;
  if (ratio >= 0.8) return 1;
  return 0;
}

// ─── Fill in the Blank ─────────────────────────────────────────────────────

function FillBlankExercise({
  sentence,
  onResult,
}: {
  sentence: DueSentence;
  onResult: (correct: boolean) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const blank = sentence.blankWord!;
  const displayText = sentence.text.replace(
    new RegExp(`\\b${blank}\\b`, "i"),
    "___"
  );

  const isCorrect =
    normalize(answer.trim()) === normalize(blank);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setSubmitted(true);
    onResult(isCorrect);
  };

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow as="p" size="sm" className="mb-3">
          Fill in the blank
        </Eyebrow>
        <p className="text-lg leading-relaxed text-foreground font-medium">
          {displayText}
        </p>
      </div>

      <div className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => !submitted && setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !submitted) handleSubmit();
          }}
          disabled={submitted}
          placeholder="Type the missing word…"
          className={[
            "w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors",
            submitted && isCorrect
              ? "border-state-success bg-state-success/8 text-foreground focus:ring-state-success/20"
              : submitted && !isCorrect
              ? "border-destructive bg-destructive/8 text-foreground focus:ring-destructive/20"
              : "border-input bg-muted/40 text-foreground focus:border-ring focus:ring-ring/20",
          ].join(" ")}
        />

        {submitted && (
          <div className="flex items-center gap-2 text-sm">
            {isCorrect ? (
              <CheckCircle className="w-4 h-4 text-state-success shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive shrink-0" />
            )}
            <span
              className={
                isCorrect ? "text-state-success" : "text-destructive"
              }
            >
              {isCorrect ? "Correct!" : `The answer is "${blank}"`}
            </span>
          </div>
        )}

        {!submitted && (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!answer.trim()}
          >
            Check
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Word Scramble ──────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ScrambleExercise({
  sentence,
  onResult,
}: {
  sentence: DueSentence;
  onResult: (correct: boolean) => void;
}) {
  const tokens = tokenize(sentence.text);
  const [pool, setPool] = useState<{ word: string; id: number }[]>(() =>
    shuffle(tokens.map((w, i) => ({ word: w, id: i })))
  );
  const [selected, setSelected] = useState<{ word: string; id: number }[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const assembled = selected.map((t) => t.word).join(" ");
  const isCorrect = normalize(assembled) === normalize(sentence.text);

  const pick = (item: { word: string; id: number }) => {
    if (submitted) return;
    setPool((p) => p.filter((t) => t.id !== item.id));
    setSelected((s) => [...s, item]);
  };

  const unpick = (item: { word: string; id: number }) => {
    if (submitted) return;
    setSelected((s) => s.filter((t) => t.id !== item.id));
    setPool((p) => [...p, item]);
  };

  const reset = () => {
    const restored = selected.concat(pool);
    setPool(shuffle(restored));
    setSelected([]);
  };

  const handleSubmit = () => {
    if (selected.length === 0) return;
    setSubmitted(true);
    onResult(isCorrect);
  };

  return (
    <div className="space-y-6">
      <Eyebrow as="p" size="sm">
        Put the words in order
      </Eyebrow>

      {/* Assembly area */}
      <div
        className="min-h-[60px] rounded-xl border border-dashed border-border bg-muted/30 p-3 flex flex-wrap gap-2 items-start"
        aria-label="Your sentence"
      >
        {selected.length === 0 && (
          <p className="text-sm text-muted-foreground/60 self-center w-full text-center">
            Tap words below to build the sentence
          </p>
        )}
        {selected.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => unpick(item)}
            disabled={submitted}
            className="text-sm font-medium bg-card border border-border rounded-md px-2.5 py-1 hover:border-foreground/40 hover:bg-secondary transition-colors duration-100 disabled:pointer-events-none"
          >
            {item.word}
          </button>
        ))}
      </div>

      {/* Word pool */}
      <div className="flex flex-wrap gap-2">
        {pool.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => pick(item)}
            disabled={submitted}
            className="text-sm font-medium bg-muted border border-border rounded-md px-2.5 py-1 hover:bg-secondary hover:border-foreground/40 transition-colors duration-100 disabled:pointer-events-none"
          >
            {item.word}
          </button>
        ))}
      </div>

      {submitted && (
        <div className="flex items-start gap-2 text-sm">
          {isCorrect ? (
            <CheckCircle className="w-4 h-4 text-state-success shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          )}
          <div>
            <span
              className={isCorrect ? "text-state-success" : "text-destructive"}
            >
              {isCorrect ? "Perfect order!" : "Not quite."}
            </span>
            {!isCorrect && (
              <p className="text-muted-foreground mt-1 leading-relaxed">
                {sentence.text}
              </p>
            )}
          </div>
        </div>
      )}

      {!submitted && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={selected.length === 0}
          >
            Check
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Recall ─────────────────────────────────────────────────────────────────

function RecallExercise({
  sentence,
  onResult,
}: {
  sentence: DueSentence;
  onResult: (score: 0 | 1 | 2) => void;
}) {
  const [attempt, setAttempt] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const score = submitted ? scoreRecall(attempt, sentence.text) : null;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!attempt.trim()) return;
    setSubmitted(true);
    onResult(scoreRecall(attempt, sentence.text));
  };

  const scoreMeta: Record<
    0 | 1 | 2,
    { label: string; color: string; Icon: typeof CheckCircle }
  > = {
    2: {
      label: "Exactly right!",
      color: "text-state-success",
      Icon: CheckCircle,
    },
    1: { label: "Close!", color: "text-state-warning", Icon: CheckCircle },
    0: { label: "Keep practising", color: "text-destructive", Icon: XCircle },
  };

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow as="p" size="sm" className="mb-3">
          Recall the sentence
        </Eyebrow>

        <div className="bg-muted/40 rounded-xl border border-border p-4 space-y-2">
          {sentence.keyExpression && (
            <p className="text-sm font-semibold text-foreground">
              {sentence.keyExpression}
            </p>
          )}
          {sentence.usageContexts?.[0] && (
            <p className="text-sm text-muted-foreground">
              {sentence.usageContexts[0]}
            </p>
          )}
          {sentence.note && (
            <p className="text-xs text-muted-foreground italic">
              {sentence.note}
            </p>
          )}
          {!sentence.keyExpression && !sentence.usageContexts?.[0] && (
            <p className="text-sm text-muted-foreground">
              From: {sentence.source}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          ref={textareaRef}
          value={attempt}
          onChange={(e) => !submitted && setAttempt(e.target.value)}
          disabled={submitted}
          placeholder="Type the full sentence from memory…"
          rows={3}
          className={[
            "w-full resize-none rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors",
            submitted && score === 2
              ? "border-state-success bg-state-success/8 focus:ring-state-success/20"
              : submitted && score === 1
              ? "border-state-warning bg-state-warning/8 focus:ring-state-warning/20"
              : submitted && score === 0
              ? "border-destructive bg-destructive/8 focus:ring-destructive/20"
              : "border-input bg-muted/40 text-foreground focus:border-ring focus:ring-ring/20",
          ].join(" ")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !submitted)
              handleSubmit();
          }}
        />

        {submitted && score !== null && (
          <div className="space-y-2">
            {(() => {
              const meta = scoreMeta[score];
              const Icon = meta.Icon;
              return (
                <div className={`flex items-center gap-2 text-sm ${meta.color}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {meta.label}
                </div>
              );
            })()}
            {score < 2 && (
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Original
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {sentence.text}
                </p>
              </div>
            )}
          </div>
        )}

        {!submitted && (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!attempt.trim()}
          >
            Check
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Rating Buttons ─────────────────────────────────────────────────────────

function RatingButtons({
  onRate,
  submitting,
}: {
  onRate: (r: Rating) => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
        How well did you know it?
      </p>
      <div className="grid grid-cols-4 gap-2">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            type="button"
            disabled={submitting}
            onClick={() => onRate(r.value)}
            className={[
              "flex flex-col items-center gap-1 py-2.5 rounded-lg border text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
              RATING_COLORS[r.value],
            ].join(" ")}
          >
            <span className="text-[0.7rem] font-bold text-muted-foreground">
              {r.shortcut}
            </span>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Results Screen ──────────────────────────────────────────────────────────

function ResultsScreen({
  count,
  locale,
}: {
  count: number;
  locale: string;
}) {
  return (
    <div className="py-16 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-state-success/10 flex items-center justify-center mx-auto">
        <CheckCircle className="w-6 h-6 text-state-success" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">
          Session complete
        </p>
        <p className="text-sm text-muted-foreground">
          {count} sentence{count !== 1 ? "s" : ""} practised
        </p>
      </div>
      <div className="flex justify-center gap-3 pt-2">
        <Button
          render={<Link href={`/${locale}/sentences`} />}
          variant="secondary"
        >
          Back to Phrase Bank
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SentencesPracticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeRaw } = use(params);
  if (!isLocale(localeRaw)) notFound();
  const locale = localeRaw;

  const dueSentences = useQuery(api.queries.sentences.getDueSentences, {
    language: locale,
  });
  const rateMutation = useMutation(api.mutations.sentences.rateSentence);
  const { execute: rateSafely, isLoading: submitting } = useAction(rateMutation);

  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<DueSentence[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exerciseResult, setExerciseResult] = useState<boolean | null>(null);
  const [recallScore, setRecallScore] = useState<0 | 1 | 2 | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [done, setDone] = useState(false);
  const [key, setKey] = useState(0); // forces re-mount of exercise component

  // Initialise queue from query once
  useEffect(() => {
    if (started && dueSentences && queue === null) {
      setQueue(dueSentences as DueSentence[]);
    }
  }, [started, dueSentences, queue]);

  const currentSentence = queue ? queue[currentIndex] : null;
  const mode = currentSentence
    ? chooseMode(currentSentence, currentIndex)
    : "recall";

  const handleExerciseResult = useCallback((correct: boolean) => {
    setExerciseResult(correct);
  }, []);

  const handleRecallResult = useCallback((score: 0 | 1 | 2) => {
    setRecallScore(score);
    setExerciseResult(score >= 1);
  }, []);

  const handleRate = async (rating: Rating) => {
    if (!currentSentence) return;
    await rateSafely({ sentenceId: currentSentence._id, rating });
    setReviewedCount((c) => c + 1);

    const nextIndex = currentIndex + 1;
    if (!queue || nextIndex >= queue.length) {
      setDone(true);
    } else {
      setCurrentIndex(nextIndex);
      setExerciseResult(null);
      setRecallScore(null);
      setKey((k) => k + 1);
    }
  };

  const isLoading = dueSentences === undefined;
  const isEmpty = !isLoading && (dueSentences?.length ?? 0) === 0;
  const total = queue?.length ?? dueSentences?.length ?? 0;
  const showRating = exerciseResult !== null || recallScore !== null;

  // Keyboard shortcuts for ratings
  useEffect(() => {
    if (!showRating || done) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
      const ratingMap: Record<string, Rating> = {
        "1": "again",
        "2": "hard",
        "3": "good",
        "4": "easy",
      };
      const r = ratingMap[e.key];
      if (r && !submitting) {
        e.preventDefault();
        handleRate(r);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRating, done, submitting, currentSentence]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <BackLink href={`/${locale}/sentences`}>Phrase Bank</BackLink>
          {started && !done && queue && (
            <span className="text-xs text-muted-foreground tabular-nums font-mono">
              {currentIndex + 1} / {total}
            </span>
          )}
        </div>

        {/* Title */}
        {!started && !done && (
          <div className="mb-8">
            <Eyebrow as="p" size="sm">
              {locale === "fr" ? "Français" : "English"}
            </Eyebrow>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-1 leading-tight">
              Practice
            </h1>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty: no sentences due */}
        {!isLoading && isEmpty && (
          <div className="py-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Dumbbell className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-foreground">
                Nothing due right now
              </p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Save more sentences or come back after your scheduled reviews.
              </p>
            </div>
            <Button
              render={<Link href={`/${locale}/sentences`} />}
              variant="secondary"
            >
              Back to Phrase Bank
            </Button>
          </div>
        )}

        {/* Hub — not started yet */}
        {!isLoading && !isEmpty && !started && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {total} sentence{total !== 1 ? "s" : ""} ready to practise.
                Each exercise builds active recall: fill blanks, unscramble
                words, or write from memory. Rate how well you knew each one
                and the scheduler does the rest.
              </p>

              <div className="flex gap-3 flex-wrap text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 inline-block" />
                  Fill in the blank
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 inline-block" />
                  Word scramble
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 inline-block" />
                  Recall from memory
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                setStarted(true);
                setQueue(null);
                setCurrentIndex(0);
                setExerciseResult(null);
                setRecallScore(null);
                setReviewedCount(0);
                setDone(false);
                setKey(0);
              }}
            >
              <Dumbbell className="w-4 h-4" />
              Start practice
            </Button>
          </div>
        )}

        {/* Done */}
        {done && <ResultsScreen count={reviewedCount} locale={locale} />}

        {/* Active session */}
        {started && !done && queue && currentSentence && (
          <div className="space-y-8">
            {/* Progress bar */}
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-300"
                style={{
                  width: `${total > 0 ? ((currentIndex) / total) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Exercise */}
            <div className="bg-card border border-border rounded-xl p-5">
              {mode === "fill_blank" && currentSentence.blankWord ? (
                <FillBlankExercise
                  key={key}
                  sentence={currentSentence}
                  onResult={handleExerciseResult}
                />
              ) : mode === "scramble" ? (
                <ScrambleExercise
                  key={key}
                  sentence={currentSentence}
                  onResult={handleExerciseResult}
                />
              ) : (
                <RecallExercise
                  key={key}
                  sentence={currentSentence}
                  onResult={handleRecallResult}
                />
              )}
            </div>

            {/* Rating — shown after exercise is answered */}
            {showRating && (
              <div className="space-y-4">
                <RatingButtons onRate={handleRate} submitting={submitting} />
                <p className="text-[0.6875rem] text-muted-foreground text-center">
                  Press 1–4 to rate
                </p>
              </div>
            )}

            {/* Show next button if exercise not yet answered */}
            {!showRating && (
              <button
                type="button"
                onClick={() => {
                  setExerciseResult(true);
                  setRecallScore(2);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mx-auto"
              >
                Skip
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
