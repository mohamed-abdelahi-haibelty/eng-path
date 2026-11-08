"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Play,
  RotateCcw,
} from "lucide-react";

import { CountdownRing } from "./_components/CountdownRing";
import { MicOrb } from "./_components/MicOrb";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ErrorMessage } from "@/components/ui/error-message";
import { SpeakingSkeleton } from "@/components/skeletons/speaking-skeleton";
import { useAction as useActionHook } from "@/hooks/use-action";
import { getLevelMeta } from "@/lib/levels";
import { isLocale } from "@/i18n/routing";
import { nextModule } from "@/lib/modules";

type Stage = "instructions" | "questions" | "processing" | "results";
type QuestionPhase = "think" | "record" | "review";

function formatScore(score: number | null | undefined): string {
  if (score == null) return "—";
  return String(score);
}

// ─── Results: single question accordion row ────────────────────────────────

interface QuestionRowProps {
  index: number;
  question: string;
  response: {
    evaluationStatus: "pending" | "done" | "error";
    transcript?: string;
    scores?: {
      fluency: number;
      coherence: number;
      vocabulary: number;
      grammar: number;
    };
    totalScore?: number;
    feedback?: string;
    suggestion?: string;
  };
  defaultOpen: boolean;
}

function QuestionRow({ index, question, response, defaultOpen }: QuestionRowProps) {
  const [open, setOpen] = useState(defaultOpen);
  const t = useTranslations("speaking");
  const tDim = useTranslations("speaking.dimensions");
  const DIMENSION_LABELS: Record<string, string> = {
    fluency: tDim("fluency"),
    coherence: tDim("coherence"),
    vocabulary: tDim("vocabulary"),
    grammar: tDim("grammar"),
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors duration-150"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground shrink-0 tabular-nums">
            Q{String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-sm font-medium text-foreground truncate">
            {question}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {response.evaluationStatus === "done" && (
            <span className="text-sm font-mono tabular-nums text-muted-foreground">
              {formatScore(response.totalScore)}/20
            </span>
          )}
          {response.evaluationStatus === "error" && (
            <AlertCircle className="w-4 h-4 text-destructive" />
          )}
          {response.evaluationStatus === "pending" && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
          {open ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 space-y-5 border-t border-border">
          {response.evaluationStatus === "error" && (
            <p className="text-sm text-destructive">
              {t("evaluationError" as never) /* fallback handled by JSON */}
            </p>
          )}

          {response.evaluationStatus === "done" && (
            <>
              {/* Dimension scores — compact 2×2 grid */}
              {response.scores && (
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(response.scores) as [string, number][]).map(
                    ([key, score]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {DIMENSION_LABELS[key] ?? key}
                          </span>
                          <span className="text-xs font-mono tabular-nums text-muted-foreground">
                            {score}/5
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-foreground/50 transition-all duration-500"
                            style={{ width: `${(score / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Transcript */}
              {response.transcript && (
                <div>
                  <Eyebrow as="h2" size="sm" className="mb-2">
                    {t("transcript")}
                  </Eyebrow>
                  <p className="text-sm text-foreground leading-relaxed bg-muted/60 rounded-lg px-4 py-3">
                    {response.transcript}
                  </p>
                </div>
              )}

              {response.feedback && (
                <div>
                  <Eyebrow as="h2" size="sm" className="mb-2">
                    {t("feedback")}
                  </Eyebrow>
                  <p className="text-sm text-foreground leading-relaxed">
                    {response.feedback}
                  </p>
                </div>
              )}

              {response.suggestion && (
                <div>
                  <Eyebrow as="h2" size="sm" className="mb-2">
                    {t("suggestion")}
                  </Eyebrow>
                  <p className="text-sm text-foreground leading-relaxed bg-secondary rounded-lg px-4 py-3">
                    {response.suggestion}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function SpeakingPage({
  params,
}: {
  params: Promise<{ locale: string; level: string; unit: string }>;
}) {
  const { locale: localeRaw, level: levelRaw, unit: unitSlug } = use(params);
  if (!isLocale(localeRaw)) notFound();
  const locale = localeRaw;
  const meta = getLevelMeta(levelRaw);
  if (!meta) notFound();

  const t = useTranslations("speaking");
  const tCommon = useTranslations("common");
  const tPhase = useTranslations("speaking.phases");
  const tModules = useTranslations("unit.modules");

  const data = useQuery(api.queries.speaking.speakingBySlug, {
    level: meta.cefrCode,
    slug: unitSlug,
  });

  const generateUploadUrl = useMutation(
    api.mutations.speaking.generateUploadUrl
  );
  const submitSpeakingMutation = useMutation(
    api.mutations.speaking.submitSpeaking
  );

  const {
    execute: submitSafely,
    error: submitError,
    isLoading: submitting,
    reset: resetSubmit,
  } = useActionHook(submitSpeakingMutation);

  // ── Local state ──────────────────────────────────────────────────────────
  const [stage, setStage] = useState<Stage | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [qPhase, setQPhase] = useState<QuestionPhase>("think");
  const [recordings, setRecordings] = useState<(Blob | null)[]>([]);
  const [replayUrl, setReplayUrl] = useState<string | null>(null);
  const [micDenied, setMicDenied] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const audioReviewRef = useRef<HTMLAudioElement>(null);

  // ── Initialise stage from server data ───────────────────────────────────
  useEffect(() => {
    if (stage !== null || data === undefined || data === null) return;
    const sub = data.submission;
    if (!sub) {
      setStage("instructions");
    } else if (
      sub.overallEvaluationStatus === "done" ||
      sub.overallEvaluationStatus === "error"
    ) {
      setStage("results");
    } else {
      setStage("processing");
    }
  }, [data, stage]);

  // ── Auto-advance processing → results ───────────────────────────────────
  useEffect(() => {
    if (stage !== "processing") return;
    const status = data?.submission?.overallEvaluationStatus;
    if (status === "done" || status === "error") setStage("results");
  }, [stage, data?.submission?.overallEvaluationStatus]);

  // ── Init recordings array when questions load ────────────────────────────
  useEffect(() => {
    if (data?.questions && recordings.length === 0) {
      setRecordings(new Array(data.questions.length).fill(null));
    }
  }, [data?.questions, recordings.length]);

  // ── Cleanup replay object URL ────────────────────────────────────────────
  const prevReplayRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevReplayRef.current && prevReplayRef.current !== replayUrl) {
      URL.revokeObjectURL(prevReplayRef.current);
    }
    prevReplayRef.current = replayUrl;
  }, [replayUrl]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleThinkComplete = useCallback(() => {
    setQPhase("record");
  }, []);

  const handleRecordingComplete = useCallback(
    (blob: Blob) => {
      setRecordings((prev) => {
        const next = [...prev];
        next[currentQ] = blob;
        return next;
      });
      setReplayUrl(URL.createObjectURL(blob));
      setQPhase("review");
    },
    [currentQ]
  );

  const handlePermissionDenied = useCallback(() => {
    setMicDenied(true);
    setQPhase("think"); // go back so user can resolve and try again
  }, []);

  const handleUploadAndSubmit = useCallback(async () => {
    if (!data) return;
    setStage("processing");
    setUploadError(null);
    resetSubmit();

    try {
      const responses: {
        order: number;
        question: string;
        audioStorageId: Id<"_storage">;
      }[] = [];

      for (let i = 0; i < data.questions.length; i++) {
        const blob = recordings[i];
        if (!blob) throw new Error(`Missing recording for question ${i + 1}`);

        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": blob.type },
          body: blob,
        });

        if (!res.ok) throw new Error(`Upload failed for question ${i + 1}`);
        const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };

        responses.push({
          order: i,
          question: data.questions[i].question,
          audioStorageId: storageId,
        });
      }

      await submitSafely({ unitId: data.unit._id, responses });
    } catch (err) {
      console.error("[SpeakingPage] upload/submit failed:", err);
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
      setStage("questions");
    }
  }, [data, recordings, generateUploadUrl, submitSafely, resetSubmit]);

  const handleConfirmAnswer = useCallback(() => {
    if (!data) return;
    audioReviewRef.current?.pause();
    const isLast = currentQ === data.questions.length - 1;
    setReplayUrl(null);
    if (isLast) {
      handleUploadAndSubmit();
    } else {
      setCurrentQ((n) => n + 1);
      setQPhase("think");
    }
  }, [currentQ, data, handleUploadAndSubmit]);

  const handleReRecord = useCallback(() => {
    audioReviewRef.current?.pause();
    setReplayUrl(null);
    setQPhase("record");
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const unitHref = `/${locale}/levels/${meta.param}/${unitSlug}`;
  const next = nextModule(locale, "speaking");
  const nextHref = next ? `/${locale}/levels/${meta.param}/${unitSlug}/${next}` : unitHref;
  const nextLabel = next ? tModules(next) : tCommon("backToUnit");

  const evaluatedCount =
    data?.submission?.responses.filter(
      (r) => r.evaluationStatus === "done" || r.evaluationStatus === "error"
    ).length ?? 0;

  const totalQuestions = data?.questions.length ?? 10;


  // ── Loading / not found ───────────────────────────────────────────────────
  if (data === undefined || stage === null) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          <BackLink href={unitHref} className="mb-8">
            {tCommon("backToUnit")}
          </BackLink>
          <SpeakingSkeleton />
        </div>
      </div>
    );
  }

  if (data === null) notFound();

  const { unit, questions, submission } = data;
  const currentQuestion = questions[currentQ];

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
        <div className="flex items-center gap-2 mb-10 text-xs font-bold uppercase tracking-widest flex-wrap">
          {(
            [
              ["instructions", tPhase("instructions")],
              ["questions", tPhase("questions")],
              ["processing", tPhase("processing")],
              ["results", tPhase("results")],
            ] as [Stage, string][]
          ).map(([s, label], i, arr) => (
            <span key={s} className="flex items-center gap-2">
              <span
                className={
                  stage === s ? "text-foreground" : "text-muted-foreground"
                }
              >
                {label}
              </span>
              {i < arr.length - 1 && (
                <span className="text-muted-foreground" aria-hidden="true">
                  ·
                </span>
              )}
            </span>
          ))}
          {stage === "questions" && (
            <span className="ml-auto text-muted-foreground">
              {currentQ + 1} / {questions.length}
            </span>
          )}
        </div>

        {/* ── Stage 1: Instructions ── */}
        {stage === "instructions" && (
          <section>
            <Eyebrow as="h2" size="sm" className="mb-4">
              {t("beforeYouBegin")}
            </Eyebrow>
            <ul className="space-y-3 mb-8">
              {(
                [
                  "ten",
                  "think",
                  "recordOnce",
                  "evaluation",
                  "headphones",
                  "quiet",
                ] as const
              ).map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-foreground/40"
                    aria-hidden="true"
                  />
                  <span className="text-base text-foreground leading-relaxed">
                    {t(`instructions.${key}` as never)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="pt-6 border-t border-border">
              <Button
                type="button"
                size="lg"
                onClick={() => {
                  setCurrentQ(0);
                  setQPhase("think");
                  setStage("questions");
                }}
              >
                {t("begin")}
              </Button>
            </div>
          </section>
        )}

        {/* ── Stage 2: Questions ── */}
        {stage === "questions" && currentQuestion && (
          <section>
            {/* Category + Question */}
            <div className="mb-10">
              <Eyebrow as="span" size="sm" className="mb-2">
                {currentQuestion.category}
              </Eyebrow>
              <p className="text-xl sm:text-2xl font-semibold text-foreground leading-snug">
                {currentQuestion.question}
              </p>
            </div>

            {/* Mic denied error */}
            {micDenied && (
              <div className="mb-6 flex items-start gap-3 border border-destructive/25 bg-destructive/5 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {tCommon("tryAgain")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMicDenied(false);
                      setQPhase("record");
                    }}
                    className="mt-2 text-sm font-semibold underline underline-offset-2 text-foreground hover:text-muted-foreground transition-colors duration-150"
                  >
                    {tCommon("tryAgain")}
                  </button>
                </div>
              </div>
            )}

            {/* Upload error */}
            {uploadError && (
              <div className="mb-6 flex items-start gap-2.5 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Think phase */}
            {qPhase === "think" && !micDenied && (
              <div className="py-12 flex items-center justify-center">
                <CountdownRing
                  key={`think-${currentQ}`}
                  durationSeconds={20}
                  onComplete={handleThinkComplete}
                />
              </div>
            )}

            {/* Record phase */}
            {qPhase === "record" && (
              <div className="py-12 flex items-center justify-center">
                <MicOrb
                  key={`record-${currentQ}`}
                  maxSeconds={currentQuestion.speakSeconds}
                  onRecordingComplete={handleRecordingComplete}
                  onPermissionDenied={handlePermissionDenied}
                />
              </div>
            )}

            {/* Review phase */}
            {qPhase === "review" && replayUrl && (
              <div className="py-8 space-y-6">
                <div>
                  <Eyebrow as="h2" size="sm" className="mb-3">
                    {t("transcript")}
                  </Eyebrow>
                  <audio
                    ref={audioReviewRef}
                    controls
                    src={replayUrl}
                    className="w-full h-10 rounded-lg"
                  />
                </div>

                <div className="pt-6 border-t border-border flex items-center gap-3">
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleConfirmAnswer}
                    disabled={submitting}
                  >
                    {currentQ === questions.length - 1
                      ? submitting
                        ? tCommon("saving")
                        : tCommon("submit")
                      : t("nextQuestion")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={handleReRecord}
                    disabled={submitting}
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    {t("rerecord")}
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Stage 3: Processing ── */}
        {stage === "processing" && (
          <section className="py-16 flex flex-col items-center gap-6 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
            <div>
              <p className="text-base font-semibold text-foreground">
                {t("evaluating")}
              </p>
              <p
                className="text-sm text-muted-foreground mt-1"
                aria-live="polite"
                aria-atomic="true"
              >
                {t("evaluatedOf", { done: evaluatedCount, total: totalQuestions })}
              </p>
            </div>
            <p className="text-xs text-muted-foreground max-w-64">
              {t("stayOnPage")}
            </p>
          </section>
        )}

        {/* ── Stage 4: Results ── */}
        {stage === "results" && submission && (
          <section className="space-y-8">
            {submission.overallEvaluationStatus === "error" &&
              !submission.overallScore && (
                <div className="flex items-start gap-3 border border-destructive/25 bg-destructive/5 rounded-xl px-5 py-4">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {tCommon("tryAgain")}
                    </p>
                  </div>
                </div>
              )}

            {/* Score hero */}
            {submission.overallScore != null && (
              <div>
                <p className="text-5xl font-bold font-mono tabular-nums text-foreground leading-none">
                  {submission.overallScore}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">
                  {Math.round(
                    (submission.overallScore / (totalQuestions * 20)) * 100,
                  )}
                  % {t("overallScore")}
                </p>
              </div>
            )}

            {/* Per-question accordion */}
            <div>
              <Eyebrow as="h2" size="sm" className="mb-4">
                {t("questionBreakdown")}
              </Eyebrow>
              <div className="space-y-2">
                {submission.responses.map((response, i) => (
                  <QuestionRow
                    key={response.order}
                    index={i}
                    question={questions[i]?.question ?? `Question ${i + 1}`}
                    response={response}
                    defaultOpen={i === 0}
                  />
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-border flex items-center gap-3">
              <Button size="lg" render={<Link href={nextHref} />}>
                {tCommon("next")}: {nextLabel}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                render={<Link href={unitHref} />}
              >
                <CheckCircle2
                  className="w-4 h-4 text-state-success"
                  aria-hidden="true"
                />
                {tCommon("backToUnit")}
              </Button>
            </div>

            <ErrorMessage error={submitError} className="text-xs" />
          </section>
        )}
      </div>
    </div>
  );
}
