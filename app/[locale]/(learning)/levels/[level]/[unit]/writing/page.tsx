"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import {
  Check,
  AlertCircle,
  Loader2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { PaperEditor, ReadOnlyPaper } from "./_components/PaperEditor";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ErrorMessage } from "@/components/ui/error-message";
import { WritingSkeleton } from "@/components/skeletons/writing-skeleton";
import { useAction as useActionHook } from "@/hooks/use-action";
import { getLevelMeta } from "@/lib/levels";
import { isLocale } from "@/i18n/routing";
import { nextModule } from "@/lib/modules";

export default function WritingPage({
  params,
}: {
  params: Promise<{ locale: string; level: string; unit: string }>;
}) {
  const { locale: localeRaw, level: levelRaw, unit: unitSlug } = use(params);
  if (!isLocale(localeRaw)) notFound();
  const locale = localeRaw;
  const meta = getLevelMeta(levelRaw);
  if (!meta) notFound();

  const t = useTranslations("writing");
  const tCommon = useTranslations("common");
  const tModules = useTranslations("unit.modules");
  const tDim = useTranslations("writing.dimensions");
  const DIMENSION_LABELS: Record<string, string> = {
    taskResponse: tDim("taskResponse"),
    coherence: tDim("coherence"),
    vocabulary: tDim("vocabulary"),
    grammar: tDim("grammar"),
  };

  const data = useQuery(api.queries.writing.writingBySlug, {
    level: meta.cefrCode,
    slug: unitSlug,
  });

  const submitWritingMutation = useMutation(api.mutations.writing.submitWriting);
  const retryMutation = useMutation(api.mutations.writing.retryEvaluation);

  const {
    execute: submitSafely,
    error: submitError,
    isLoading: submitting,
    reset: resetSubmit,
  } = useActionHook(submitWritingMutation);

  const {
    execute: retrySafely,
    error: retryError,
    isLoading: retrying,
    reset: resetRetry,
  } = useActionHook(retryMutation);

  const [text, setText] = useState("");
  const [showDetails, setShowDetails] = useState(true);
  const draftLoadedRef = useRef(false);

  // Load draft from localStorage once unit is known and no submission exists
  useEffect(() => {
    const unitId = data?.unit?._id;
    if (!draftLoadedRef.current && unitId && !data?.submission) {
      draftLoadedRef.current = true;
      const saved = localStorage.getItem(`writing-draft-${unitId}`);
      if (saved) setText(saved);
    }
  }, [data?.unit?._id, data?.submission]);

  // Persist draft; clear when submitted
  useEffect(() => {
    const unitId = data?.unit?._id;
    if (!unitId) return;
    if (data?.submission) {
      localStorage.removeItem(`writing-draft-${unitId}`);
    } else if (text) {
      localStorage.setItem(`writing-draft-${unitId}`, text);
    } else {
      localStorage.removeItem(`writing-draft-${unitId}`);
    }
  }, [text, data?.unit?._id, data?.submission]);

  const unitHref = `/${locale}/levels/${meta.param}/${unitSlug}`;
  const next = nextModule(locale, "writing");
  const nextHref = next ? `/${locale}/levels/${meta.param}/${unitSlug}/${next}` : unitHref;
  const nextLabel = next ? tModules(next) : tCommon("backToUnit");

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          <BackLink href={unitHref} className="mb-8">
            {tCommon("backToUnit")}
          </BackLink>
          <WritingSkeleton />
        </div>
      </div>
    );
  }

  if (data === null) notFound();

  const { unit, module: writingModule, submission } = data;

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const canSubmit =
    !submitting &&
    wordCount >= writingModule.minWords &&
    wordCount <= writingModule.maxWords;

  const isPending = submission?.feedbackStatus === "pending";
  const isDone = submission?.feedbackStatus === "done";
  const isError = submission?.feedbackStatus === "error";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    resetSubmit();
    await submitSafely({ unitId: unit._id, text, wordCount });
  };

  const handleRetry = async () => {
    if (!submission) return;
    resetRetry();
    await retrySafely({ submissionId: submission._id });
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

        {/* Phase indicator */}
        <div className="flex items-center gap-2 mb-8 text-xs font-bold uppercase tracking-widest">
          {isDone || isError ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Check className="w-3 h-3" aria-hidden="true" />
              {t("writePhase")}
            </span>
          ) : (
            <span className="text-foreground">{t("writePhase")}</span>
          )}
          <span className="text-muted-foreground" aria-hidden="true">
            ·
          </span>
          <span
            className={
              isDone || isError ? "text-foreground" : "text-muted-foreground"
            }
          >
            {t("feedbackPhase")}
          </span>
        </div>

        {/* ── Collapsible prompt + vocab (Writing phase only) ── */}
        {!isDone && !isError && (
          <div className="mb-6">
            {showDetails && (
              <>
                <div className="mb-5">
                  <Eyebrow as="h2" size="sm" className="mb-2">
                    {t("prompt")}
                  </Eyebrow>
                  <p className="text-base text-foreground leading-relaxed">
                    {writingModule.prompt}
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    {t("minMax", {
                      min: writingModule.minWords,
                      max: writingModule.maxWords,
                    })}
                  </p>
                </div>

                {writingModule.suggestedVocab.length > 0 && (
                  <div className="mb-5">
                    <Eyebrow as="h2" size="sm" className="mb-2">
                      {t("suggestedVocabulary")}
                    </Eyebrow>
                    <div className="flex flex-wrap gap-1.5">
                      {writingModule.suggestedVocab.map((word: string) => (
                        <span
                          key={word}
                          className="border border-border rounded px-2 py-0.5 text-xs font-semibold text-foreground"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Toggle row — centered divider with hide/show button */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setShowDetails((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 shrink-0"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    {t("hidePrompt")}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    {t("showPrompt")}
                  </>
                )}
              </button>
              <div className="flex-1 h-px bg-border" aria-hidden="true" />
            </div>
          </div>
        )}

        {/* Prompt reference — visible in feedback phase */}
        {(isDone || isError) && (
          <div className="mb-8">
            <Eyebrow as="h2" size="sm" className="mb-2">
              {t("prompt")}
            </Eyebrow>
            <p className="text-base text-foreground leading-relaxed">
              {writingModule.prompt}
            </p>
          </div>
        )}

        {/* ── Phase 1: Writing ── */}
        {!isDone && !isError && (
          <section>
            {isPending ? (
              <div className="space-y-4">
                <PaperEditor
                  value={submission.text}
                  readOnly
                  disabled
                  maxWords={writingModule.maxWords}
                  minWords={writingModule.minWords}
                />
                <div
                  className="flex items-center gap-2.5 text-sm text-muted-foreground py-2"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>{t("evaluating")}</span>
                </div>
              </div>
            ) : (
              <PaperEditor
                value={text}
                onChange={setText}
                maxWords={writingModule.maxWords}
                minWords={writingModule.minWords}
                disabled={submitting}
              />
            )}

            {!isPending && (
              <div className="mt-8 pt-6 border-t border-border flex items-center gap-4">
                <Button
                  type="button"
                  size="lg"
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("submitting")}
                    </>
                  ) : (
                    t("submit")
                  )}
                </Button>

                {!canSubmit && !submitting && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t("wordsCount", { count: wordCount })} · {t("minMax", { min: writingModule.minWords, max: writingModule.maxWords })}
                  </span>
                )}

                <ErrorMessage error={submitError} className="text-xs" />
              </div>
            )}
          </section>
        )}

        {/* ── Phase 2: Feedback ── */}
        {(isDone || isError) && submission && (
          <section className="space-y-8">
            {/* Error state */}
            {isError && (
              <div className="border border-destructive/25 bg-destructive/5 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-semibold mb-0.5">
                      {t("evaluationError")}
                    </p>
                    <ErrorMessage error={retryError} className="mt-2 text-xs" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRetry}
                    disabled={retrying}
                  >
                    {retrying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    {t("retry")}
                  </Button>
                </div>
              </div>
            )}

            {isDone && submission.score !== undefined && (
              <>
                {/* Strengths first — start with what the learner did well */}
                {submission.strengths && submission.strengths.length > 0 && (
                  <div>
                    <Eyebrow as="h2" size="sm" className="mb-3">
                      {t("strengths")}
                    </Eyebrow>
                    <ul className="space-y-2">
                      {submission.strengths.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check
                            className="mt-0.5 w-4 h-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span className="text-sm text-foreground leading-relaxed">
                            {s}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {submission.weaknesses && submission.weaknesses.length > 0 && (
                  <div>
                    <Eyebrow as="h2" size="sm" className="mb-3">
                      {t("weaknesses")}
                    </Eyebrow>
                    <ul className="space-y-2">
                      {submission.weaknesses.map((w: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span
                            className="mt-1 w-1.5 h-1.5 rounded-full shrink-0 bg-muted-foreground/50"
                            aria-hidden="true"
                          />
                          <span className="text-sm text-foreground leading-relaxed">
                            {w}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rubric breakdown with score integrated as a label */}
                {submission.dimensions && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Eyebrow as="h2" size="sm">
                        {t("rubric")}
                      </Eyebrow>
                      <span className="text-sm font-mono font-semibold tabular-nums text-muted-foreground">
                        {submission.score} / 100
                      </span>
                    </div>
                    <div className="space-y-3">
                      {(
                        Object.entries(submission.dimensions) as [
                          string,
                          number,
                        ][]
                      ).map(([key, score]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between gap-4"
                        >
                          <span className="text-sm text-foreground font-medium">
                            {DIMENSION_LABELS[key] ?? key}
                          </span>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-24 h-1.5 rounded-full bg-border overflow-hidden">
                              <div
                                className="h-full rounded-full bg-foreground/60 transition-all duration-500"
                                style={{ width: `${(score / 25) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-mono tabular-nums text-muted-foreground w-10 text-right">
                              {score} / 25
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Your response — compare to model */}
                <div>
                  <Eyebrow as="h2" size="sm" className="mb-3">
                    {t("yourResponse")}
                  </Eyebrow>
                  <ReadOnlyPaper
                    text={submission.text}
                    copyLabel={t("copy")}
                  />
                </div>

                {submission.modelRewrite && (
                  <div>
                    <Eyebrow as="h2" size="sm" className="mb-3">
                      {t("modelAnswer")}
                    </Eyebrow>
                    <ReadOnlyPaper
                      text={submission.modelRewrite}
                      copyLabel={t("copy")}
                    />
                  </div>
                )}
              </>
            )}

            {isDone && (
              <div className="pt-6 border-t border-border flex items-center gap-3">
                <Button size="lg" render={<Link href={nextHref} />}>
                  {tCommon("next")}: {nextLabel}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  render={<Link href={unitHref} />}
                >
                  {tCommon("backToUnit")}
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
