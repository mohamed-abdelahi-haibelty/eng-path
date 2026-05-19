"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CheckCircle2, RotateCcw, Trophy } from "lucide-react";

import { AudioOrb } from "./_components/AudioOrb";
import { QuestionCard } from "../reading/_components/QuestionCard";
import { useAction as useActionHook } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ErrorMessage } from "@/components/ui/error-message";
import { ListeningSkeleton } from "@/components/skeletons/listening-skeleton";
import { getLevelMeta } from "@/lib/levels";

type Phase = "audio" | "questions";

export default function ListeningPage({
  params,
}: {
  params: Promise<{ level: string; unit: string }>;
}) {
  const { level: levelRaw, unit: unitSlug } = use(params);
  const meta = getLevelMeta(levelRaw);
  if (!meta) notFound();

  const data = useQuery(api.queries.listening.listeningBySlug, {
    level: meta.cefrCode,
    slug: unitSlug,
  });

  const submitScore = useMutation(api.mutations.listening.submitListeningScore);
  const recordListenMutation = useMutation(api.mutations.listening.recordListen);

  const {
    execute: submitScoreSafely,
    error: submitError,
    isLoading: saving,
    reset: resetSubmit,
  } = useActionHook(submitScore);

  const [phase, setPhase] = useState<Phase>("audio");
  // Track whether user has completed at least one full listen this session
  const [sessionListens, setSessionListens] = useState(0);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const handleOrbComplete = useCallback(() => {
    setSessionListens((n) => n + 1);
    if (!data) return;
    void recordListenMutation({ unitId: data.unit._id });
  }, [data, recordListenMutation]);

  const initialListensUsed = data?.progress.listeningListensUsed ?? 0;
  const totalListensUsed = Math.min(initialListensUsed + sessionListens, 2);
  const listensRemaining = 2 - totalListensUsed;
  const canProceed = initialListensUsed > 0 || sessionListens > 0;

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

  const unitHref = `/levels/${meta.param}/${unitSlug}`;

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          <BackLink href={unitHref} className="mb-8">Back to unit</BackLink>
          <ListeningSkeleton />
        </div>
      </div>
    );
  }

  if (data === null) notFound();

  const questions = data.module.questions;
  const answeredCount = questions.filter((q) => answers[q.id]).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
        <BackLink href={unitHref} className="mb-8">Back to unit</BackLink>

        {/* Header */}
        <div className="mb-10">
          <Eyebrow as="span" size="sm">
            Unit {String(data.unit.unitNumber).padStart(2, "0")} &middot;{" "}
            {data.unit.level} &middot; Listening
          </Eyebrow>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mt-2 mb-0 leading-tight">
            {data.module.title}
          </h1>
        </div>

        {/* Phase indicator */}
        <div className="flex items-center gap-2 mb-8 text-xs font-bold uppercase tracking-widest">
          <span className={phase === "audio" ? "text-foreground" : "text-muted-foreground"}>
            Audio
          </span>
          <span className="text-muted-foreground" aria-hidden="true">·</span>
          <span className={phase === "questions" ? "text-foreground" : "text-muted-foreground"}>
            Questions
          </span>
        </div>

        {/* ── Phase 1: Audio Player ── */}
        {phase === "audio" && (
          <section>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <Eyebrow as="h2" size="sm">Audio Dialogue</Eyebrow>
                <p className="text-sm text-muted-foreground mt-1.5">
                  TOEFL plays audio once. You get 2 listens here to practice under that constraint.
                </p>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground mt-0.5">
                {listensRemaining === 0
                  ? "Both listens used"
                  : `${listensRemaining} listen${listensRemaining === 1 ? "" : "s"} remaining`}
              </span>
            </div>

            <div className="py-16 flex items-center justify-center">
              <AudioOrb
                audioUrl={data.audioUrl}
                initialListensUsed={initialListensUsed}
                onComplete={handleOrbComplete}
              />
            </div>

            <div className="mt-8 pt-6 border-t border-border flex items-center gap-4">
              <Button
                type="button"
                size="lg"
                disabled={!canProceed}
                onClick={() => setPhase("questions")}
              >
                Go to Questions
              </Button>
              {!canProceed && (
                <span className="text-xs text-muted-foreground">
                  Complete at least one listen to continue
                </span>
              )}
            </div>
          </section>
        )}

        {/* ── Phase 2: Questions ── */}
        {phase === "questions" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <Eyebrow as="h2" size="sm">Comprehension Questions</Eyebrow>
              <div className="flex items-center gap-3">
                {listensRemaining > 0 && (
                  <button
                    type="button"
                    onClick={() => setPhase("audio")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 underline underline-offset-2"
                  >
                    Back to audio
                  </button>
                )}
                <span className="text-xs text-muted-foreground">
                  {questions.length} questions
                </span>
              </div>
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
                <div className="mb-6 flex items-center justify-between">
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
                          ? "Listening complete. Continue to Writing."
                          : "Score 60% or higher to complete Listening."}
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
        )}
      </div>
    </div>
  );
}
