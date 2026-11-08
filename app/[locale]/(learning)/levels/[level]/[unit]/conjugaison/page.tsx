"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { CheckCircle2, RotateCcw, Trophy } from "lucide-react";

import { useAction as useActionHook } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ErrorMessage } from "@/components/ui/error-message";
import { ConjugaisonSkeleton } from "@/components/skeletons/conjugaison-skeleton";
import { getLevelMeta } from "@/lib/levels";
import { isLocale } from "@/i18n/routing";
import { nextModule } from "@/lib/modules";

type Exercise = {
  id: string;
  type:
    | "fill_conjugation"
    | "choose_correct_form"
    | "transform_tense"
    | "error_correction";
  instruction: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
};

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.?!]$/, "");
}

function isCorrectAnswer(ex: Exercise, userAnswer: string): boolean {
  return norm(userAnswer) === norm(ex.answer);
}

function ExerciseControl({
  exercise,
  answer,
  onAnswer,
  submitted,
}: {
  exercise: Exercise;
  answer: string;
  onAnswer: (v: string) => void;
  submitted: boolean;
}) {
  if (exercise.options && exercise.options.length > 0) {
    return (
      <div className="space-y-2">
        {exercise.options.map((opt) => {
          const isSelected = answer === opt;
          const isCorrectOpt = opt === exercise.answer;
          const showSuccess = submitted && isCorrectOpt;
          const showError = submitted && isSelected && !isCorrectOpt;
          const dimmed = submitted && !isSelected && !isCorrectOpt;
          return (
            <button
              key={opt}
              type="button"
              disabled={submitted}
              onClick={() => onAnswer(opt)}
              className={[
                "block w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors duration-150",
                !submitted && isSelected
                  ? "border-foreground bg-muted text-foreground"
                  : !submitted
                    ? "border-border text-foreground hover:bg-muted"
                    : "",
                showSuccess
                  ? "border-state-success bg-state-success/8 text-foreground"
                  : "",
                showError
                  ? "border-destructive bg-destructive/8 text-foreground"
                  : "",
                dimmed ? "border-border text-muted-foreground opacity-60" : "",
              ].join(" ")}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={answer}
      onChange={(e) => onAnswer(e.target.value)}
      disabled={submitted}
      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      placeholder=""
      autoComplete="off"
      spellCheck={false}
    />
  );
}

export default function ConjugaisonPage({
  params,
}: {
  params: Promise<{ locale: string; level: string; unit: string }>;
}) {
  const { locale: localeRaw, level: levelRaw, unit: unitSlug } = use(params);
  if (!isLocale(localeRaw)) notFound();
  const locale = localeRaw;
  // Conjugaison is a French-only module.
  if (locale !== "fr") notFound();
  const meta = getLevelMeta(levelRaw);
  if (!meta) notFound();

  const t = useTranslations("conjugaison");
  const tCommon = useTranslations("common");
  const tModules = useTranslations("unit.modules");

  const data = useQuery(api.queries.conjugaison.conjugaisonBySlug, {
    level: meta.cefrCode,
    slug: unitSlug,
  });

  const submitScore = useMutation(
    api.mutations.conjugaison.submitConjugaisonScore,
  );
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

  const unitHref = `/${locale}/levels/${meta.param}/${unitSlug}`;
  const next = nextModule(locale, "conjugaison");
  const nextHref = next ? `/${locale}/levels/${meta.param}/${unitSlug}/${next}` : unitHref;
  const nextLabel = next ? tModules(next) : tCommon("backToUnit");

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          <BackLink href={unitHref} className="mb-8">
            {tCommon("backToUnit")}
          </BackLink>
          <ConjugaisonSkeleton />
        </div>
      </div>
    );
  }

  if (data === null) notFound();

  const exercises = data.module.exercises as Exercise[];

  const handleAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleCheck = async () => {
    if (saving) return;
    const map: Record<string, boolean> = {};
    let correct = 0;
    for (const ex of exercises) {
      const ok = isCorrectAnswer(ex, answers[ex.id] ?? "");
      map[ex.id] = ok;
      if (ok) correct++;
    }
    const pct = Math.round((correct / exercises.length) * 100);
    setCorrectMap(map);
    setScore(pct);
    setSubmitted(true);
    await submitScoreSafely({ unitId: data.unit._id, score: pct });
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setCorrectMap({});
    setScore(null);
    resetSubmit();
  };

  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k].trim() !== "",
  ).length;
  const correctCount = Object.values(correctMap).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
        <BackLink href={unitHref} className="mb-8">
          {tCommon("backToUnit")}
        </BackLink>

        <div className="mb-10">
          <Eyebrow as="span" size="sm">
            {t("eyebrow", {
              number: String(data.unit.unitNumber).padStart(2, "0"),
              level: data.unit.level,
            })}
          </Eyebrow>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mt-2 leading-tight font-mono">
            {data.module.verb}
          </h1>
          <p className="text-base text-muted-foreground mt-2">
            {data.module.tense}
          </p>
        </div>

        <div className="border-t border-border mb-10" />

        <section className="mb-12">
          <Eyebrow as="h2" size="sm" className="mb-4">
            {t("conjugationTable")}
          </Eyebrow>
          <div className="rounded-xl border border-border bg-muted/40 divide-y divide-border">
            {data.module.conjugationTable.map((row) => (
              <div
                key={row.pronoun}
                className="flex items-baseline justify-between gap-4 px-5 py-3"
              >
                <span className="text-sm text-muted-foreground">
                  {row.pronoun}
                </span>
                <span className="text-base font-mono text-foreground">
                  {row.form}
                </span>
              </div>
            ))}
          </div>

          {data.module.irregularNotes && (
            <div className="mt-6 rounded-xl border border-border bg-card px-5 py-4">
              <Eyebrow as="p" size="sm" className="mb-2">
                {t("irregularNotes")}
              </Eyebrow>
              <p className="text-sm text-foreground leading-relaxed">
                {data.module.irregularNotes}
              </p>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <Eyebrow as="h2" size="sm">
              {t("practiceExercises")}
            </Eyebrow>
            <span className="text-xs text-muted-foreground">
              {t("questionCount", { count: exercises.length })}
            </span>
          </div>

          <div className="space-y-4">
            {exercises.map((ex, idx) => {
              const ok = submitted ? (correctMap[ex.id] ?? null) : null;
              const cardBorder =
                submitted && ok !== null
                  ? ok
                    ? "border-state-success"
                    : "border-destructive"
                  : "border-border";
              return (
                <div
                  key={ex.id}
                  className={`rounded-xl border bg-card p-5 transition-colors ${cardBorder}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground mt-0.5 pt-px">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <p className="text-sm text-foreground leading-6 flex-1">
                      {ex.instruction}
                    </p>
                  </div>
                  <p className="ml-7 mb-3 text-sm text-foreground leading-6">
                    {ex.question}
                  </p>
                  <div className="ml-7">
                    <ExerciseControl
                      exercise={ex}
                      answer={answers[ex.id] ?? ""}
                      onAnswer={(v) => handleAnswer(ex.id, v)}
                      submitted={submitted}
                    />
                    {submitted && ok !== null && (
                      <div className="mt-3 pt-3 border-t border-border space-y-1">
                        {!ok && (
                          <p className="text-sm text-foreground">
                            <span className="font-mono">{ex.answer}</span>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground leading-5">
                          {ex.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            {submitted && score !== null && (
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy
                    className={`w-5 h-5 shrink-0 ${
                      score >= 70 ? "text-state-success" : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {t("scoreCorrect", {
                        correct: correctCount,
                        total: exercises.length,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {score >= 70 ? t("passMessage") : t("failMessage")}
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
                  onClick={handleCheck}
                  disabled={saving}
                  size="lg"
                >
                  {saving ? tCommon("saving") : t("checkAnswers")}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleRetry}
                >
                  <RotateCcw className="w-4 h-4" />
                  {t("retry")}
                </Button>
              )}

              {!submitted && (
                <span className="text-xs text-muted-foreground">
                  {t("answered", {
                    answered: answeredCount,
                    total: exercises.length,
                  })}
                </span>
              )}

              {submitted && score !== null && score >= 70 && (
                <Button
                  variant="ghost"
                  size="lg"
                  nativeButton={false}
                  render={<Link href={nextHref} />}
                >
                  <CheckCircle2 className="w-4 h-4 text-state-success" />
                  {tCommon("next")}: {nextLabel}
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
