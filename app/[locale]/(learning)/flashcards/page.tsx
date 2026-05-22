"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Volume2, RotateCcw, BarChart2 } from "lucide-react";

import { useAction as useActionHook } from "@/hooks/use-action";
import { type AppError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ErrorMessage } from "@/components/ui/error-message";
import { FlashcardReviewSkeleton } from "@/components/skeletons/flashcard-review-skeleton";
import { isLocale } from "@/i18n/routing";

type Rating = "again" | "hard" | "good" | "easy";

type DueCard = {
  flashcardId: Id<"flashcards">;
  word: string;
  partOfSpeech: string;
  phonetics: string;
  audioUrl: string;
  arabicTranslation: string | null;
  state: string;
  reps: number;
};

const RATING_COLORS: Record<Rating, string> = {
  again: "border-destructive/40 hover:border-destructive hover:bg-destructive/6 text-foreground",
  hard: "border-state-warning/40 hover:border-state-warning hover:bg-state-warning/6 text-foreground",
  good: "border-state-success/40 hover:border-state-success hover:bg-state-success/6 text-foreground",
  easy: "border-border hover:border-foreground/40 hover:bg-muted text-foreground",
};

function formatNextDue(ms: number | null | undefined): string {
  if (!ms) return "soon";
  const diff = ms - Date.now();
  if (diff < 0) return "now";
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(diff / 3600000);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(diff / 86400000);
  return `${days}d`;
}

function CardWidget({
  card,
  flipped,
  onFlip,
  onRate,
  submitting,
  submitError,
}: {
  card: DueCard;
  flipped: boolean;
  onFlip: () => void;
  onRate: (r: Rating) => void;
  submitting: boolean;
  submitError: AppError | null;
}) {
  const t = useTranslations("flashcards");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const RATINGS: { value: Rating; label: string; shortcut: string }[] = [
    { value: "again", label: t("again"), shortcut: "1" },
    { value: "hard", label: t("hard"), shortcut: "2" },
    { value: "good", label: t("good"), shortcut: "3" },
    { value: "easy", label: t("easy"), shortcut: "4" },
  ];

  useEffect(() => {
    if (flipped) return;
    const audio = new Audio(card.audioUrl);
    audioRef.current = audio;
    audio.play().catch(() => null);
    return () => {
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.flashcardId]);

  const handleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) {
      audioRef.current = new Audio(card.audioUrl);
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => null);
  };

  return (
    <div className="space-y-5">
      <div
        className="relative w-full cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{ perspective: "1000px" }}
        onClick={!flipped ? onFlip : undefined}
        role="button"
        aria-label={flipped ? undefined : t("flip")}
        tabIndex={0}
        onKeyDown={(e) => {
          if (!flipped && (e.key === "Enter" || e.key === " ")) onFlip();
        }}
      >
        <div
          className="relative w-full transition-transform"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transitionDuration: "400ms",
            transitionTimingFunction: "ease-in-out",
            height: "220px",
          }}
        >
          <div
            className="absolute inset-0 rounded-xl border border-border bg-card flex flex-col items-center justify-center px-6 py-8 gap-3"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
              {card.partOfSpeech}
            </p>
            <p className="text-3xl font-bold text-foreground tracking-tight text-center">
              {card.word}
            </p>
            <div className="flex items-center gap-2.5 mt-1">
              <span className="font-mono text-sm text-muted-foreground">
                {card.phonetics}
              </span>
              <button
                onClick={handleAudio}
                className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground/50 mt-2 tracking-wide">
              {t("show")}
            </p>
          </div>

          <div
            className="absolute inset-0 rounded-xl border border-border bg-card flex flex-col items-center justify-center px-6 py-8 gap-4"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
              {card.partOfSpeech}
            </p>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              {card.word}
            </p>
            {card.arabicTranslation && (
              <p
                className="text-2xl font-semibold text-muted-foreground mt-1"
                dir="rtl"
                lang="ar"
              >
                {card.arabicTranslation}
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        className="transition-all duration-300"
        style={{
          opacity: flipped ? 1 : 0,
          pointerEvents: flipped ? "auto" : "none",
          transform: flipped ? "translateY(0)" : "translateY(6px)",
        }}
      >
        <ErrorMessage error={submitError} className="mb-3" />
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
    </div>
  );
}

function EmptyDeckState({ locale }: { locale: "en" | "fr" }) {
  const t = useTranslations("flashcards");
  return (
    <div className="py-12 text-center space-y-4">
      <p className="text-base font-semibold text-foreground">{t("noCards")}</p>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        {t("noCardsSubtitle")}
      </p>
      <Button variant="secondary" render={<Link href={`/${locale}`} />} className="mt-2">
        {t("browseUnits")}
      </Button>
    </div>
  );
}

function AllDoneState({
  nextDue,
  locale,
}: {
  nextDue: number | null | undefined;
  locale: "en" | "fr";
}) {
  const t = useTranslations("flashcards");
  return (
    <div className="py-12 text-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-state-success/10 flex items-center justify-center mx-auto">
        <svg
          className="w-6 h-6 text-state-success"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-base font-semibold text-foreground">
        {t("allCaughtUp")}
      </p>
      {nextDue && (
        <p className="text-sm text-muted-foreground">
          {t("nextDue", { when: formatNextDue(nextDue) })}
        </p>
      )}
      <div className="flex justify-center gap-3 pt-2">
        <Button variant="secondary" render={<Link href={`/${locale}/flashcards/stats`} />}>
          <BarChart2 className="w-4 h-4" />
          {t("viewStats")}
        </Button>
        <Button variant="ghost" render={<Link href={`/${locale}`} />}>
          {t("browseUnits")}
        </Button>
      </div>
    </div>
  );
}

function SessionComplete({
  count,
  nextDue,
  onRestart,
  locale,
}: {
  count: number;
  nextDue: number | null;
  onRestart: () => void;
  locale: "en" | "fr";
}) {
  const t = useTranslations("flashcards");
  return (
    <div className="py-12 text-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-state-success/10 flex items-center justify-center mx-auto">
        <svg
          className="w-6 h-6 text-state-success"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-base font-semibold text-foreground">{t("sessionComplete")}</p>
      <p className="text-sm text-muted-foreground">
        {t("cardsReviewed", { count })}
        {nextDue ? ` · ${t("nextDue", { when: formatNextDue(nextDue) })}` : ""}
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <Button variant="secondary" render={<Link href={`/${locale}/flashcards/stats`} />}>
          <BarChart2 className="w-4 h-4" />
          {t("viewStats")}
        </Button>
        <Button variant="ghost" onClick={onRestart}>
          <RotateCcw className="w-4 h-4" />
          {t("reviewAgain")}
        </Button>
      </div>
    </div>
  );
}

export default function FlashcardsReviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeRaw } = use(params);
  if (!isLocale(localeRaw)) notFound();
  const locale = localeRaw;

  const t = useTranslations("flashcards");
  const tCommon = useTranslations("common");

  const data = useQuery(api.queries.flashcards.dueCards, { language: locale });
  const rateCardMutation = useMutation(api.mutations.flashcards.rateCard);
  const {
    execute: rateSafely,
    error: rateError,
    isLoading: submitting,
    reset: resetRateError,
  } = useActionHook(rateCardMutation);

  const [sessionCards, setSessionCards] = useState<DueCard[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [lastNextDue, setLastNextDue] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (data?.status === "active" && sessionCards === null) {
      setSessionCards(data.cards as DueCard[]);
    }
  }, [data, sessionCards]);

  const handleFlip = useCallback(() => {
    setFlipped(true);
  }, []);

  const handleRate = useCallback(
    async (rating: Rating) => {
      if (!sessionCards) return;
      const card = sessionCards[currentIndex];
      if (!card) return;

      resetRateError();
      const result = await rateSafely({ flashcardId: card.flashcardId, rating });
      if (result) {
        setLastNextDue(result.nextDue);
      }

      setReviewedCount((c) => c + 1);
      const nextIndex = currentIndex + 1;
      if (nextIndex >= sessionCards.length) {
        setDone(true);
      } else {
        setCurrentIndex(nextIndex);
        setFlipped(false);
      }
    },
    [sessionCards, currentIndex, rateSafely, resetRateError],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!sessionCards || done) return;

      if (!flipped && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        handleFlip();
        return;
      }
      if (flipped && !submitting) {
        const ratingMap: Record<string, Rating> = {
          "1": "again",
          "2": "hard",
          "3": "good",
          "4": "easy",
        };
        const r = ratingMap[e.key];
        if (r) {
          e.preventDefault();
          handleRate(r);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipped, sessionCards, done, submitting, handleFlip, handleRate]);

  const handleRestart = () => {
    setSessionCards(null);
    setCurrentIndex(0);
    setFlipped(false);
    setReviewedCount(0);
    setLastNextDue(null);
    setDone(false);
  };

  const isLoading = data === undefined;
  const currentCard = sessionCards ? sessionCards[currentIndex] : null;
  const totalInSession = sessionCards?.length ?? 0;
  const remaining = totalInSession - currentIndex;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-6 sm:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <BackLink href={`/${locale}`}>{tCommon("back")}</BackLink>
          <Link
            href={`/${locale}/flashcards/stats`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            {t("viewStats")}
          </Link>
        </div>

        <div className="mb-8">
          <Eyebrow as="span" size="sm">
            {t("dailyReview")}
          </Eyebrow>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-1 leading-tight">
            {t("dailyReview")}
          </h1>
        </div>

        {isLoading && <FlashcardReviewSkeleton />}

        {!isLoading && data?.status === "empty_deck" && (
          <EmptyDeckState locale={locale} />
        )}

        {!isLoading && data?.status === "all_done" && !sessionCards && (
          <AllDoneState
            nextDue={(data as { status: "all_done"; nextDue: number | null }).nextDue}
            locale={locale}
          />
        )}

        {!isLoading && sessionCards && done && (
          <SessionComplete
            count={reviewedCount}
            nextDue={lastNextDue}
            onRestart={handleRestart}
            locale={locale}
          />
        )}

        {!isLoading && sessionCards && !done && currentCard && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("remaining", { count: remaining })}
              </span>
              <span className="text-muted-foreground font-mono tabular-nums text-xs">
                {t("progress", { done: currentIndex + 1, total: totalInSession })}
              </span>
            </div>

            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-300"
                style={{
                  width: `${totalInSession > 0 ? (currentIndex / totalInSession) * 100 : 0}%`,
                }}
              />
            </div>

            <CardWidget
              card={currentCard}
              flipped={flipped}
              onFlip={handleFlip}
              onRate={handleRate}
              submitting={submitting}
              submitError={rateError ?? null}
            />
          </div>
        )}
      </div>
    </div>
  );
}
