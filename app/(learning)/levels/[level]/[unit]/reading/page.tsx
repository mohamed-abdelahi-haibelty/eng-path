"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CheckCircle2, RotateCcw, Trophy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { VocabCarousel } from "./_components/VocabCarousel";
import { QuestionCard } from "./_components/QuestionCard";
import { useAction as useActionHook } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ErrorMessage } from "@/components/ui/error-message";
import { ReadingSkeleton } from "@/components/skeletons/reading-skeleton";
import { getLevelMeta } from "@/lib/levels";

export default function ReadingPage({
  params,
}: {
  params: Promise<{ level: string; unit: string }>;
}) {
  const { level: levelRaw, unit: unitSlug } = use(params);
  const meta = getLevelMeta(levelRaw);

  if (!meta) notFound();

  const data = useQuery(api.queries.reading.readingBySlug, {
    level: meta.cefrCode,
    slug: unitSlug,
  });

  const vocab = useQuery(
    api.queries.vocabulary.vocabularyByUnit,
    data?.unit._id ? { unitId: data.unit._id } : "skip"
  );

  const submitScore = useMutation(api.mutations.reading.submitReadingScore);
  const addToFlashcardsMutation = useMutation(api.mutations.reading.addToFlashcards);

  const {
    execute: submitScoreSafely,
    error: submitError,
    isLoading: saving,
    reset: resetSubmit,
  } = useActionHook(submitScore);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const handleSelect = (questionId: string, key: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: key }));
  };

  const handleSubmit = async () => {
    if (!data || saving) return;

    let correct = 0;
    for (const q of data.module.questions) {
      if (answers[q.id] === q.correct) correct++;
    }

    const scorePercent = Math.round((correct / data.module.questions.length) * 100);
    setCorrectCount(correct);
    setScore(scorePercent);
    setSubmitted(true);

    await submitScoreSafely({ unitId: data.unit._id, score: scorePercent });
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setCorrectCount(0);
    resetSubmit();
  };

  const handleAddToFlashcards = async (id: Id<"vocabulary">) => {
    await addToFlashcardsMutation({ vocabularyId: id });
  };

  const unitHref = `/levels/${meta.param}/${unitSlug}`;
  const answeredCount = data
    ? data.module.questions.filter((q) => answers[q.id]).length
    : 0;

  if (data === undefined || (data !== null && vocab === undefined)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          <BackLink href={unitHref} className="mb-8">Back to unit</BackLink>
          <ReadingSkeleton />
        </div>
      </div>
    );
  }

  if (data === null) notFound();

  const questions = data.module.questions;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
        <BackLink href={unitHref} className="mb-8">Back to unit</BackLink>

        {/* Header */}
        <div className="mb-10">
          <Eyebrow as="span" size="sm">
            Unit {String(data.unit.unitNumber).padStart(2, "0")} &middot;{" "}
            {data.unit.level} &middot; Reading
          </Eyebrow>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mt-2 mb-0 leading-tight">
            {data.module.title}
          </h1>
        </div>

        {/* ── Section 1: Vocabulary Preview ── */}
        {vocab && vocab.length > 0 && (
          <>
            <section className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <Eyebrow as="h2" size="sm">Vocabulary Preview</Eyebrow>
                <span className="text-xs text-muted-foreground">
                  {vocab.length} words
                </span>
              </div>
              <VocabCarousel
                words={vocab}
                onAddToFlashcards={handleAddToFlashcards}
              />
            </section>
            <div className="border-t border-border mb-10" />
          </>
        )}

        {/* ── Section 2: Reading Passage ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <Eyebrow as="h2" size="sm">Reading Passage</Eyebrow>
            <span className="text-xs text-muted-foreground tabular-nums">
              {data.module.wordCount} words
            </span>
          </div>

          <div className="prose-reset text-[1.0625rem] leading-[1.75] text-foreground max-w-[65ch]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-foreground">{children}</em>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold text-foreground mt-4 mb-2">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 space-y-1 mb-4">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 space-y-1 mb-4">{children}</ol>
                ),
                li: ({ children }) => <li className="text-foreground">{children}</li>,
              }}
            >
              {data.module.passage}
            </ReactMarkdown>
          </div>
        </section>

        <div className="border-t border-border mb-10" />

        {/* ── Section 3: Comprehension Questions ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <Eyebrow as="h2" size="sm">Comprehension Questions</Eyebrow>
            <span className="text-xs text-muted-foreground">
              {questions.length} questions
            </span>
          </div>

          <div className="space-y-8">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                index={idx}
                question={q.question}
                options={[
                  { key: "a", label: q.options.a },
                  { key: "b", label: q.options.b },
                  { key: "c", label: q.options.c },
                  { key: "d", label: q.options.d },
                ]}
                selected={answers[q.id] ?? null}
                onSelect={(key) => handleSelect(q.id, key)}
                submitted={submitted}
                correct={q.correct}
                explanation={q.explanation}
              />
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-border">
            {submitted && score !== null && (
              <div
                className="mb-6 flex items-center justify-between"
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="flex items-center gap-3">
                  <Trophy
                    className={`w-5 h-5 shrink-0 ${
                      score >= 60 ? "text-state-success" : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {correctCount} / {questions.length} correct
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {score >= 60
                        ? "Reading complete. Return to the unit to continue."
                        : "Score 60% or higher to complete Reading."}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    score >= 60 ? "text-state-success" : "text-destructive"
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
                  onClick={handleSubmit}
                  disabled={answeredCount < questions.length || saving}
                  size="lg"
                >
                  {saving ? "Saving…" : "Submit Answers"}
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
                  {answeredCount} of {questions.length} answered
                </span>
              )}

              {submitted && score !== null && score >= 60 && (
                <Button
                  variant="ghost"
                  size="lg"
                  render={<Link href={unitHref} />}
                >
                  <CheckCircle2 className="w-4 h-4 text-state-success" />
                  Back to unit
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
