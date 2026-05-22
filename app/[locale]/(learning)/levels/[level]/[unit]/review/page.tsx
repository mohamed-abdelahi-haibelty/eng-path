"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { CheckCircle2, XCircle, Trophy, Loader2 } from "lucide-react";

import { useAction as useActionHook } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ErrorMessage } from "@/components/ui/error-message";
import { ReviewSkeleton } from "@/components/skeletons/review-skeleton";
import { getLevelMeta } from "@/lib/levels";
import { isLocale } from "@/i18n/routing";

type ExercisePayload = Doc<"reviewExercises">["exercise"];

const OPTION_LETTERS = ["a", "b", "c", "d", "e", "f"] as const;

function checkAnswer(exercise: ExercisePayload, userAnswer: string): boolean {
  switch (exercise.type) {
    case "multiple_choice_grammar":
      return userAnswer === exercise.correct;
    case "vocabulary_choice":
    case "vocabulary_definition":
    case "odd_one_out":
    case "comprehension_recall":
      return userAnswer === exercise.correct;
    case "fill_in_the_blank":
      if (exercise.options && exercise.options.length > 0) {
        return userAnswer === exercise.answer;
      }
      return (
        userAnswer.trim().toLowerCase() === exercise.answer.trim().toLowerCase()
      );
    case "error_correction":
      return (
        userAnswer.trim().toLowerCase() === exercise.correct.trim().toLowerCase()
      );
    case "true_or_false":
      return userAnswer === String(exercise.answer);
    case "sentence_transformation":
      return (
        userAnswer.trim().toLowerCase() === exercise.answer.trim().toLowerCase()
      );
    default:
      return false;
  }
}

function getCorrectLabel(exercise: ExercisePayload): string {
  switch (exercise.type) {
    case "multiple_choice_grammar": {
      const opt =
        exercise.options[exercise.correct as keyof typeof exercise.options];
      return `${exercise.correct}) ${opt}`;
    }
    case "vocabulary_choice":
    case "vocabulary_definition":
    case "odd_one_out":
    case "comprehension_recall":
      return exercise.correct;
    case "fill_in_the_blank":
    case "sentence_transformation":
      return exercise.answer;
    case "error_correction":
      return exercise.correct;
    case "true_or_false":
      return exercise.answer ? "TRUE" : "FALSE";
    default:
      return "";
  }
}

function ChoiceOption({
  displayKey,
  label,
  value,
  currentAnswer,
  correctValue,
  onSelect,
  submitted,
}: {
  displayKey: string;
  label: string;
  value: string;
  currentAnswer: string;
  correctValue: string;
  onSelect: (v: string) => void;
  submitted: boolean;
}) {
  const isSelected = currentAnswer === value;
  const isCorrectOption = value === correctValue;
  const showSuccess = submitted && isCorrectOption;
  const showError = submitted && isSelected && !isCorrectOption;
  const dimmed = submitted && !isSelected && !isCorrectOption;

  return (
    <button
      type="button"
      onClick={() => !submitted && onSelect(value)}
      disabled={submitted}
      className={[
        "w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        !submitted && !isSelected
          ? "border-border text-foreground hover:bg-muted"
          : null,
        !submitted && isSelected
          ? "border-foreground bg-muted text-foreground"
          : null,
        showSuccess
          ? "border-state-success bg-state-success/8 text-foreground"
          : null,
        showError
          ? "border-destructive bg-destructive/8 text-foreground"
          : null,
        dimmed ? "border-border text-muted-foreground opacity-60" : null,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="inline-flex items-center gap-3 w-full">
        <span className="text-xs font-bold uppercase text-muted-foreground w-4 shrink-0">
          {displayKey}
        </span>
        <span className="flex-1">{label}</span>
        {showSuccess && (
          <CheckCircle2 className="w-4 h-4 text-state-success shrink-0" />
        )}
        {showError && (
          <XCircle className="w-4 h-4 text-destructive shrink-0" />
        )}
      </span>
    </button>
  );
}

const TEXT_INPUT_CLASS =
  "w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:opacity-60 disabled:cursor-not-allowed";

function ExerciseControl({
  exercise,
  answer,
  onAnswer,
  submitted,
}: {
  exercise: ExercisePayload;
  answer: string;
  onAnswer: (v: string) => void;
  submitted: boolean;
}) {
  const tReview = useTranslations("review");
  switch (exercise.type) {
    case "multiple_choice_grammar": {
      return (
        <div className="space-y-2">
          {exercise.sentence && (
            <p className="text-sm text-foreground mb-3 pb-3 border-b border-border">
              {exercise.sentence}
            </p>
          )}
          {OPTION_LETTERS.filter((k) => k in exercise.options).map((k) => (
            <ChoiceOption
              key={k}
              displayKey={k}
              label={exercise.options[k as keyof typeof exercise.options]}
              value={k}
              currentAnswer={answer}
              correctValue={exercise.correct}
              onSelect={onAnswer}
              submitted={submitted}
            />
          ))}
        </div>
      );
    }

    case "vocabulary_choice": {
      return (
        <div className="space-y-2">
          <p className="text-sm text-foreground mb-3">{exercise.sentence}</p>
          {exercise.options.map((opt, i) => (
            <ChoiceOption
              key={opt}
              displayKey={OPTION_LETTERS[i] ?? String(i + 1)}
              label={opt}
              value={opt}
              currentAnswer={answer}
              correctValue={exercise.correct}
              onSelect={onAnswer}
              submitted={submitted}
            />
          ))}
        </div>
      );
    }

    case "vocabulary_definition": {
      return (
        <div className="space-y-2">
          {exercise.word && (
            <p className="text-base font-semibold text-foreground mb-3 pb-3 border-b border-border">
              {exercise.word}
            </p>
          )}
          {exercise.options.map((opt, i) => (
            <ChoiceOption
              key={opt}
              displayKey={OPTION_LETTERS[i] ?? String(i + 1)}
              label={opt}
              value={opt}
              currentAnswer={answer}
              correctValue={exercise.correct}
              onSelect={onAnswer}
              submitted={submitted}
            />
          ))}
        </div>
      );
    }

    case "odd_one_out": {
      return (
        <div className="space-y-2">
          {exercise.words.map((word, i) => (
            <ChoiceOption
              key={word}
              displayKey={OPTION_LETTERS[i] ?? String(i + 1)}
              label={word}
              value={word}
              currentAnswer={answer}
              correctValue={exercise.correct}
              onSelect={onAnswer}
              submitted={submitted}
            />
          ))}
        </div>
      );
    }

    case "comprehension_recall": {
      const sourceLabel =
        exercise.source === "reading" ? "Reading" : "Listening";
      return (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground mb-1">
            From {sourceLabel}
          </p>
          <p className="text-sm text-foreground mb-3">{exercise.question}</p>
          {exercise.options.map((opt, i) => (
            <ChoiceOption
              key={opt}
              displayKey={OPTION_LETTERS[i] ?? String(i + 1)}
              label={opt}
              value={opt}
              currentAnswer={answer}
              correctValue={exercise.correct}
              onSelect={onAnswer}
              submitted={submitted}
            />
          ))}
        </div>
      );
    }

    case "true_or_false": {
      const correctValue = String(exercise.answer);
      return (
        <div className="space-y-3">
          <p className="text-sm text-foreground">{exercise.statement}</p>
          <div className="flex gap-3">
            {(["true", "false"] as const).map((val) => {
              const isSelected = answer === val;
              const isCorrectOption = val === correctValue;
              const showSuccess = submitted && isCorrectOption;
              const showError = submitted && isSelected && !isCorrectOption;
              const dimmed =
                submitted && !isSelected && !isCorrectOption;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => !submitted && onAnswer(val)}
                  disabled={submitted}
                  className={[
                    "px-6 py-2 rounded-lg border text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    !submitted && !isSelected
                      ? "border-border text-foreground hover:bg-muted"
                      : null,
                    !submitted && isSelected
                      ? "border-foreground bg-muted text-foreground"
                      : null,
                    showSuccess
                      ? "border-state-success bg-state-success/8 text-foreground"
                      : null,
                    showError
                      ? "border-destructive bg-destructive/8 text-foreground"
                      : null,
                    dimmed ? "border-border text-muted-foreground opacity-60" : null,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {val === "true" ? tReview("true") : tReview("false")}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    case "fill_in_the_blank": {
      if (exercise.options && exercise.options.length > 0) {
        return (
          <div className="space-y-2">
            <p className="text-sm text-foreground mb-3">{exercise.sentence}</p>
            {exercise.options.map((opt, i) => (
              <ChoiceOption
                key={opt}
                displayKey={OPTION_LETTERS[i] ?? String(i + 1)}
                label={opt}
                value={opt}
                currentAnswer={answer}
                correctValue={exercise.answer}
                onSelect={onAnswer}
                submitted={submitted}
              />
            ))}
          </div>
        );
      }
      return (
        <div className="space-y-3">
          <p className="text-sm text-foreground">{exercise.sentence}</p>
          <input
            type="text"
            value={answer}
            onChange={(e) => !submitted && onAnswer(e.target.value)}
            disabled={submitted}
            placeholder="Your answer…"
            className={TEXT_INPUT_CLASS}
          />
        </div>
      );
    }

    case "error_correction": {
      return (
        <div className="space-y-3">
          <div>
            <span className="text-xs text-muted-foreground block mb-1.5">
              Incorrect sentence:
            </span>
            <p className="text-sm text-foreground italic bg-muted/50 rounded-lg px-4 py-2.5">
              {exercise.incorrect}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block mb-1.5">
              Your correction:
            </span>
            <input
              type="text"
              value={answer}
              onChange={(e) => !submitted && onAnswer(e.target.value)}
              disabled={submitted}
              placeholder="Rewrite the sentence correctly…"
              className={TEXT_INPUT_CLASS}
            />
          </div>
        </div>
      );
    }

    case "sentence_transformation": {
      return (
        <div className="space-y-3">
          <p className="text-sm text-foreground">{exercise.original}</p>
          {exercise.prompt && (
            <p className="text-xs text-muted-foreground italic">
              {exercise.prompt}
            </p>
          )}
          <input
            type="text"
            value={answer}
            onChange={(e) => !submitted && onAnswer(e.target.value)}
            disabled={submitted}
            placeholder="Write the transformed sentence…"
            className={TEXT_INPUT_CLASS}
          />
        </div>
      );
    }

    default:
      return null;
  }
}

function ExerciseItem({
  doc,
  index,
  answer,
  onAnswer,
  submitted,
  isCorrect,
}: {
  doc: Doc<"reviewExercises">;
  index: number;
  answer: string;
  onAnswer: (v: string) => void;
  submitted: boolean;
  isCorrect: boolean | null;
}) {
  const tReview = useTranslations("review");
  const tCommon = useTranslations("common");
  const correctLabel = (() => {
    const raw = getCorrectLabel(doc.exercise);
    if (raw === "TRUE") return tReview("true");
    if (raw === "FALSE") return tReview("false");
    return raw;
  })();
  void tCommon;
  const numStr = String(index + 1).padStart(2, "0");

  return (
    <div className="border-t border-border pt-6 pb-6">
      <div className="flex items-start gap-3 mb-4">
        <span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground mt-0.5">
          {numStr}
        </span>
        <p className="flex-1 text-sm text-foreground leading-snug">
          {doc.instruction}
        </p>
        {submitted && isCorrect !== null &&
          (isCorrect ? (
            <CheckCircle2
              className="w-4 h-4 text-state-success shrink-0 mt-0.5"
              aria-label="Correct"
            />
          ) : (
            <XCircle
              className="w-4 h-4 text-destructive shrink-0 mt-0.5"
              aria-label="Incorrect"
            />
          ))}
      </div>

      <div className="ml-7">
        <ExerciseControl
          exercise={doc.exercise}
          answer={answer}
          onAnswer={onAnswer}
          submitted={submitted}
        />

        {submitted && isCorrect !== null && (
          <div
            className={[
              "mt-4 pt-4 border-t text-xs leading-relaxed space-y-1.5",
              isCorrect
                ? "border-state-success/20"
                : "border-destructive/20",
            ].join(" ")}
          >
            {!isCorrect && (
              <p className="text-foreground">
                <span className="font-semibold">{tReview("retry")}: </span>
                {correctLabel}
              </p>
            )}
            <p className="text-muted-foreground">{doc.exercise.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ locale: string; level: string; unit: string }>;
}) {
  const { locale: localeRaw, level: levelRaw, unit: unitSlug } = use(params);
  if (!isLocale(localeRaw)) notFound();
  const locale = localeRaw;
  const meta = getLevelMeta(levelRaw);
  if (!meta) notFound();

  const t = useTranslations("review");
  const tCommon = useTranslations("common");
  const tLevel = useTranslations("level");

  const data = useQuery(api.queries.review.reviewBySlug, {
    level: meta.cefrCode,
    slug: unitSlug,
  });

  const submitReviewMutation = useMutation(api.mutations.review.submitReview);
  const {
    execute: submitSafely,
    error: submitError,
    isLoading: saving,
    reset: resetSubmit,
  } = useActionHook(submitReviewMutation);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{
    score: number;
    correctCount: number;
    correctMap: Record<string, boolean>;
  } | null>(null);

  const unitHref = `/${locale}/levels/${meta.param}/${unitSlug}`;
  const levelHref = `/${locale}/levels/${meta.param}`;

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          <BackLink href={unitHref} className="mb-8">
            {tCommon("backToUnit")}
          </BackLink>
          <ReviewSkeleton />
        </div>
      </div>
    );
  }

  if (data === null) notFound();

  const { unit, exercises, progress } = data;

  const alreadyDone = progress.reviewCompleted && results === null;

  const handleAnswer = (exId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [exId]: value }));
  };

  const answeredCount = exercises.filter(
    (ex) => !!answers[ex._id]?.trim()
  ).length;
  const unansweredCount = exercises.length - answeredCount;

  const handleSubmit = async () => {
    if (saving || unansweredCount > 0) return;
    resetSubmit();

    const correctMap: Record<string, boolean> = {};
    let correctCount = 0;
    for (const ex of exercises) {
      const userAnswer = answers[ex._id] ?? "";
      const correct = checkAnswer(ex.exercise, userAnswer);
      correctMap[ex._id] = correct;
      if (correct) correctCount++;
    }

    const score =
      exercises.length > 0
        ? Math.round((correctCount / exercises.length) * 100)
        : 100;

    setResults({ score, correctCount, correctMap });
    await submitSafely({ unitId: unit._id, score });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
        <BackLink href={unitHref} className="mb-8">
          {tCommon("backToUnit")}
        </BackLink>

        <div className="mb-10">
          <Eyebrow as="span" size="sm">
            {t("eyebrow", {
              number: String(unit.unitNumber).padStart(2, "0"),
              level: unit.level,
            })}
          </Eyebrow>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mt-2 mb-0 leading-tight">
            {unit.topic}
          </h1>
        </div>

        {/* Already completed on load */}
        {alreadyDone && (
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-state-success/10 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6 text-state-success" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t("unitComplete")}</p>
                {progress.reviewScore !== undefined && (
                  <p className="text-sm text-muted-foreground mt-0.5 font-mono tabular-nums">
                    {progress.reviewScore}%
                  </p>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-border flex items-center gap-3">
              <Button size="lg" render={<Link href={levelHref} />}>
                {t("backToLevel", { level: tLevel(`${meta.param}.name`) })}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                render={<Link href={unitHref} />}
              >
                {tCommon("backToUnit")}
              </Button>
            </div>
          </section>
        )}

        {/* Answering / results flow */}
        {!alreadyDone && (
          <>
            {/* Score summary (appears after submission) */}
            {results && (
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy
                    className={`w-5 h-5 shrink-0 ${
                      results.score >= 70
                        ? "text-state-success"
                        : "text-muted-foreground"
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {results.correctCount} / {exercises.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("unitComplete")}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    results.score >= 70
                      ? "text-state-success"
                      : "text-destructive"
                  }`}
                  aria-label={`Score: ${results.score} percent`}
                >
                  {results.score}%
                </span>
              </div>
            )}

            {/* Exercise list */}
            <div>
              {exercises.map((ex, idx) => (
                <ExerciseItem
                  key={ex._id}
                  doc={ex}
                  index={idx}
                  answer={answers[ex._id] ?? ""}
                  onAnswer={(v) => handleAnswer(ex._id, v)}
                  submitted={results !== null}
                  isCorrect={
                    results ? (results.correctMap[ex._id] ?? null) : null
                  }
                />
              ))}
            </div>

            {/* Submit bar / CTA */}
            <div className="border-t border-border pt-6 mt-2">
              <ErrorMessage error={submitError} className="mb-4" />

              {results ? (
                <div className="flex items-center gap-3">
                  {saving && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {tCommon("saving")}
                    </span>
                  )}
                  <Button size="lg" render={<Link href={levelHref} />}>
                    {t("backToLevel", { level: tLevel(`${meta.param}.name`) })}
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    render={<Link href={unitHref} />}
                  >
                    {tCommon("backToUnit")}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    size="lg"
                    disabled={saving || unansweredCount > 0}
                    onClick={handleSubmit}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {tCommon("saving")}
                      </>
                    ) : (
                      t("submit")
                    )}
                  </Button>

                  {!saving && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {t("answeredOf", {
                        answered: answeredCount,
                        total: exercises.length,
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
