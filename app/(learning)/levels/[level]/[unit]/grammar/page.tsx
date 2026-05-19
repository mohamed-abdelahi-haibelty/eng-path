"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  useQuery,
  useMutation,
  useAction as useConvexAction,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { CheckCircle2, RotateCcw, Trophy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { checkAnswer } from "./_components/grammar-types";
import { mdComponents } from "./_components/MarkdownComponents";
import { ExerciseCard } from "./_components/ExerciseCard";
import { useAction as useActionHook } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ErrorMessage } from "@/components/ui/error-message";
import { GrammarSkeleton } from "@/components/skeletons/grammar-skeleton";
import { getLevelMeta } from "@/lib/levels";

export default function GrammarPage({
  params,
}: {
  params: Promise<{ level: string; unit: string }>;
}) {
  const { level: levelRaw, unit: unitSlug } = use(params);
  const meta = getLevelMeta(levelRaw);

  if (!meta) notFound();

  const data = useQuery(api.queries.grammar.grammarBySlug, {
    level: meta.cefrCode,
    slug: unitSlug,
  });

  const prefetchTranslations = useConvexAction(
    api.actions.vocabulary.prefetchUnitTranslations,
  );

  useEffect(() => {
    if (!data?.unit._id) return;
    prefetchTranslations({ unitId: data.unit._id });
  }, [data?.unit._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitScore = useMutation(api.mutations.grammar.submitGrammarScore);
  const {
    execute: submitScoreSafely,
    error: submitError,
    isLoading: saving,
    reset: resetSubmit,
  } = useActionHook(submitScore);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [correctMap, setCorrectMap] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState<number | null>(null);

  const handleAnswer = (exId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [exId]: value }));
  };

  const handleCheckAnswers = async () => {
    if (!data || saving) return;

    const newCorrectMap: Record<string, boolean> = {};
    let correctCount = 0;

    for (const ex of data.exercises) {
      const userAnswer = answers[ex._id] ?? "";
      const isCorrect = checkAnswer(ex.exercise, userAnswer);
      newCorrectMap[ex._id] = isCorrect;
      if (isCorrect) correctCount++;
    }

    const scorePercent = Math.round(
      (correctCount / data.exercises.length) * 100,
    );

    setCorrectMap(newCorrectMap);
    setScore(scorePercent);
    setSubmitted(true);

    await submitScoreSafely({ unitId: data.unit._id, score: scorePercent });
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setCorrectMap({});
    setScore(null);
    resetSubmit();
  };

  const unitHref = `/levels/${meta.param}/${unitSlug}`;
  const readingHref = `/levels/${meta.param}/${unitSlug}/reading`;

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          <BackLink href={unitHref} className="mb-8">
            Back to unit
          </BackLink>
          <GrammarSkeleton />
        </div>
      </div>
    );
  }

  if (data === null) notFound();

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k].trim() !== "",
  ).length;
  const correctCount = Object.values(correctMap).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
        <BackLink href={unitHref} className="mb-8">
          Back to unit
        </BackLink>

        <div className="mb-10">
          <Eyebrow as="span" size="sm">
            Unit {String(data.unit.unitNumber).padStart(2, "0")} &middot;{" "}
            {data.unit.level} &middot; Grammar
          </Eyebrow>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mt-2 mb-0 leading-tight">
            {data.unit.grammarPoint}
          </h1>
        </div>

        <div className="border-t border-border mb-10" />

        <section className="mb-12">
          <div className="prose-reset">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={mdComponents}
            >
              {data.module.explanationMarkdown}
            </ReactMarkdown>
          </div>

          {data.module.examples.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-muted/40 px-5 py-4">
              <Eyebrow as="p" size="sm" className="mb-3">
                Examples
              </Eyebrow>
              <ol className="space-y-2">
                {data.module.examples.map((ex, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 font-mono text-xs text-muted-foreground mt-1">
                      {i + 1}.
                    </span>
                    <span className="text-sm text-foreground leading-6">
                      {ex}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <Eyebrow as="h2" size="sm">
              Practice Exercises
            </Eyebrow>
            <span className="text-xs text-muted-foreground">
              {data.exercises.length} questions
            </span>
          </div>

          <div className="space-y-4">
            {data.exercises.map((exercise, idx) => (
              <ExerciseCard
                key={exercise._id}
                exercise={exercise}
                index={idx}
                answer={answers[exercise._id] ?? ""}
                onAnswer={(v) => handleAnswer(exercise._id, v)}
                submitted={submitted}
                isCorrect={submitted ? correctMap[exercise._id] ?? null : null}
              />
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            {submitted && score !== null && (
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy
                    className={`w-5 h-5 shrink-0 ${
                      score >= 70
                        ? "text-state-success"
                        : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {correctCount} / {data.exercises.length} correct
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {score >= 70
                        ? "Grammar unlocked, you can now start Reading."
                        : "Score 70% or higher to unlock the Reading module."}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    score >= 70 ? "text-state-success" : "text-destructive"
                  }`}
                >
                  {score}%
                </span>
              </div>
            )}

            <ErrorMessage error={submitError} className="mb-4" />

            <div className="flex items-center gap-3">
              {!submitted ? (
                <Button
                  type="button"
                  onClick={handleCheckAnswers}
                  disabled={saving}
                  size="lg"
                >
                  {saving ? "Saving…" : "Check Answers"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleRetry}
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </Button>
              )}

              {!submitted && (
                <span className="text-xs text-muted-foreground">
                  {answeredCount} of {data.exercises.length} answered
                </span>
              )}

              {submitted && score !== null && score >= 70 && (
                <Button
                  variant="ghost"
                  size="lg"
                  nativeButton={false}
                  render={<Link href={readingHref} />}
                >
                  <CheckCircle2 className="w-4 h-4 text-state-success" />
                  Next: Reading
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
