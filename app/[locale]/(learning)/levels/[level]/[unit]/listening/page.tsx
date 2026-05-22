"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
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
import { isLocale } from "@/i18n/routing";
import { nextModule } from "@/lib/modules";

type Phase = "audio" | "questions";

export default function ListeningPage({
  params,
}: {
  params: Promise<{ locale: string; level: string; unit: string }>;
}) {
  const { locale: localeRaw, level: levelRaw, unit: unitSlug } = use(params);
  if (!isLocale(localeRaw)) notFound();
  const locale = localeRaw;
  const meta = getLevelMeta(levelRaw);
  if (!meta) notFound();

  const t = useTranslations("listening");
  const tCommon = useTranslations("common");
  const tModules = useTranslations("unit.modules");

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

  const unitHref = `/${locale}/levels/${meta.param}/${unitSlug}`;
  const next = nextModule(locale, "listening");
  const nextHref = next ? `/${locale}/levels/${meta.param}/${unitSlug}/${next}` : unitHref;
  const nextLabel = next ? tModules(next) : tCommon("backToUnit");

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          <BackLink href={unitHref} className="mb-8">{tCommon("backToUnit")}</BackLink>
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
        <BackLink href={unitHref} className="mb-8">{tCommon("backToUnit")}</BackLink>

        <div className="mb-10">
          <Eyebrow as="span" size="sm">
            {t("eyebrow", {
              number: String(data.unit.unitNumber).padStart(2, "0"),
              level: data.unit.level,
            })}
          </Eyebrow>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mt-2 mb-0 leading-tight">
            {data.module.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 mb-8 text-xs font-bold uppercase tracking-widest">
          <span className={phase === "audio" ? "text-foreground" : "text-muted-foreground"}>
            {tModules("listening")}
          </span>
          <span className="text-muted-foreground" aria-hidden="true">·</span>
          <span className={phase === "questions" ? "text-foreground" : "text-muted-foreground"}>
            {t("comprehensionQuestions")}
          </span>
        </div>

        {phase === "audio" && (
          <section>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <Eyebrow as="h2" size="sm">{t("audioDialogue")}</Eyebrow>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {t("twoListens")}
                </p>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground mt-0.5">
                {t("listensRemaining", { count: listensRemaining })}
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
                {t("goToQuestions")}
              </Button>
              {!canProceed && (
                <span className="text-xs text-muted-foreground">
                  {t("completeAtLeastOne")}
                </span>
              )}
            </div>
          </section>
        )}

        {phase === "questions" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <Eyebrow as="h2" size="sm">{t("comprehensionQuestions")}</Eyebrow>
              <div className="flex items-center gap-3">
                {listensRemaining > 0 && (
                  <button
                    type="button"
                    onClick={() => setPhase("audio")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 underline underline-offset-2"
                  >
                    {t("backToAudio")}
                  </button>
                )}
                <span className="text-xs text-muted-foreground">
                  {t("questionCount", { count: questions.length })}
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
                        {correctCount} / {questions.length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {score >= 60 ? t("passMessage") : t("failMessage")}
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
                    {saving ? tCommon("saving") : t("submit")}
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
                    {answeredCount} {tCommon("of")} {questions.length}
                  </span>
                )}

                {submitted && score !== null && score >= 60 && (
                  <>
                    <Button size="lg" render={<Link href={nextHref} />}>
                      <CheckCircle2 className="w-4 h-4" />
                      {tCommon("next")}: {nextLabel}
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      render={<Link href={unitHref} />}
                    >
                      {tCommon("backToUnit")}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
