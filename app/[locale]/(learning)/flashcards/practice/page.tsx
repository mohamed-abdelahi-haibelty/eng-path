"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery, useAction as useConvexAction } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { BarChart2, ChevronLeft, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { isLocale } from "@/i18n/routing";

import type { CompletionData, Mode, PracticeCard, SentenceFillItem, SentenceConstraints } from "./_components/types";
import { shuffle } from "./_components/utils";
import { PracticeHub } from "./_components/PracticeHub";
import { MultipleChoiceSession } from "./_components/MultipleChoiceSession";
import { SpellSession } from "./_components/SpellSession";
import { MatchSession } from "./_components/MatchSession";
import { SentenceFillSession } from "./_components/SentenceFillSession";
import { SentenceWriteSession } from "./_components/SentenceWriteSession";
import { SessionComplete } from "./_components/SessionComplete";

const FILL_COUNT = 10;
const WRITE_COUNT = 8;

type PagePhase =
  | { tag: "hub" }
  | { tag: "mode"; mode: Exclude<Mode, "sentenceFill" | "sentenceWrite"> }
  | { tag: "fillLoading" }
  | { tag: "fillError" }
  | { tag: "fillSession"; sentences: SentenceFillItem[] }
  | { tag: "writeLoading" }
  | { tag: "writeError" }
  | { tag: "writeSession"; wordList: PracticeCard[]; constraints: SentenceConstraints[] }
  | { tag: "complete"; data: CompletionData };

function AILoading({ message }: { message: string }) {
  return (
    <div className="py-16 text-center space-y-3">
      <div className="w-8 h-8 mx-auto rounded-full border-2 border-border border-t-foreground animate-spin" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function AIError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const t = useTranslations("flashcards.practice");
  return (
    <div className="py-12 text-center space-y-3">
      <p className="text-sm font-semibold text-foreground">{message}</p>
      <Button variant="secondary" onClick={onRetry}>
        <RotateCcw className="w-4 h-4" />
        {t("retry")}
      </Button>
    </div>
  );
}

export default function FlashcardPracticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeRaw } = use(params);
  if (!isLocale(localeRaw)) notFound();
  const locale = localeRaw;

  const t = useTranslations("flashcards.practice");
  const tFlash = useTranslations("flashcards");
  const tCommon = useTranslations("common");

  const cards = useQuery(api.queries.flashcards.allCards, { language: locale });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiAny = api as any;
  const generateSentenceFill = useConvexAction(
    apiAny.actions.flashcardExercises.generateSentenceFill,
  );
  const generateSentenceWriteConstraints = useConvexAction(
    apiAny.actions.flashcardExercises.generateSentenceWriteConstraints,
  );
  const evaluateSentence = useConvexAction(
    apiAny.actions.flashcardExercises.evaluateSentence,
  );

  const [phase, setPhase] = useState<PagePhase>({ tag: "hub" });
  const [sessionKey, setSessionKey] = useState(0);
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  const handleSelectMode = useCallback(
    async (mode: Mode) => {
      if (mode === "sentenceFill") {
        setPhase({ tag: "fillLoading" });
        try {
          const wordSample = shuffle(cards ?? [])
            .slice(0, FILL_COUNT)
            .map((c) => ({ word: c.word, partOfSpeech: c.partOfSpeech }));
          const sentences = await generateSentenceFill({
            words: wordSample,
            language: locale,
          });
          if (!sentences || sentences.length === 0) {
            setPhase({ tag: "fillError" });
          } else {
            setPhase({ tag: "fillSession", sentences });
          }
        } catch {
          setPhase({ tag: "fillError" });
        }
      } else if (mode === "sentenceWrite") {
        setPhase({ tag: "writeLoading" });
        try {
          const wordList = shuffle(cards ?? []).slice(0, WRITE_COUNT);
          const wordSample = wordList.map((c) => ({
            word: c.word,
            partOfSpeech: c.partOfSpeech,
          }));
          const constraints = await generateSentenceWriteConstraints({
            words: wordSample,
            language: locale,
          });
          setPhase({
            tag: "writeSession",
            wordList,
            constraints: constraints ?? [],
          });
        } catch {
          setPhase({ tag: "writeError" });
        }
      } else {
        setPhase({ tag: "mode", mode });
      }
    },
    [cards, generateSentenceFill, locale],
  );

  const handleComplete = useCallback(
    (mode: Mode, score: number, total: number, timeMs?: number) => {
      setPhase({ tag: "complete", data: { mode, score, total, timeMs } });
    },
    [],
  );

  const handlePlayAgain = useCallback(() => {
    if (phase.tag !== "complete") return;
    setSessionKey((k) => k + 1);
    handleSelectMode(phase.data.mode);
  }, [phase, handleSelectMode]);

  const handleChooseDifferent = useCallback(() => {
    setConfirmAbandon(false);
    setSessionKey((k) => k + 1);
    setPhase({ tag: "hub" });
  }, []);

  const isLoading = cards === undefined;
  const practiceCards: PracticeCard[] = cards ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-6 sm:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          {phase.tag === "hub" ? (
            <BackLink href={`/${locale}/flashcards`}>
              {tCommon("back")}
            </BackLink>
          ) : confirmAbandon ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t("leaveSession")}
              </span>
              <button
                onClick={handleChooseDifferent}
                className="text-sm font-semibold text-destructive hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                {t("leaveCta")}
              </button>
              <span className="text-muted-foreground/30" aria-hidden="true">
                ·
              </span>
              <button
                onClick={() => setConfirmAbandon(false)}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                {t("stayCta")}
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (
                  phase.tag === "mode" ||
                  phase.tag === "fillSession" ||
                  phase.tag === "writeSession"
                ) {
                  setConfirmAbandon(true);
                } else {
                  handleChooseDifferent();
                }
              }}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              {t("chooseDifferent")}
            </button>
          )}
          <Link
            href={`/${locale}/flashcards/stats`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            {tFlash("viewStats")}
          </Link>
        </div>

        {/* Title — shown on hub only */}
        {phase.tag === "hub" && (
          <div className="mb-8">
            <Eyebrow as="span" size="sm">
              {tFlash("section")}
            </Eyebrow>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-1 leading-tight">
              {t("title")}
            </h1>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Hub */}
        {!isLoading && phase.tag === "hub" && (
          <PracticeHub
            key={sessionKey}
            cards={practiceCards}
            onSelect={handleSelectMode}
            locale={locale}
          />
        )}

        {/* AI fill loading / error */}
        {phase.tag === "fillLoading" && (
          <AILoading message={t("generating")} />
        )}
        {phase.tag === "fillError" && (
          <AIError
            message={t("aiError")}
            onRetry={() => handleSelectMode("sentenceFill")}
          />
        )}

        {/* AI write loading / error */}
        {phase.tag === "writeLoading" && (
          <AILoading message={t("writeGenerating")} />
        )}
        {phase.tag === "writeError" && (
          <AIError
            message={t("writeGenError")}
            onRetry={() => handleSelectMode("sentenceWrite")}
          />
        )}

        {/* Sessions */}
        {!isLoading && phase.tag === "mode" && (
          <>
            {phase.mode === "multipleChoice" && (
              <MultipleChoiceSession
                key={sessionKey}
                cards={practiceCards}
                onComplete={(s, tot) =>
                  handleComplete("multipleChoice", s, tot)
                }
              />
            )}
            {phase.mode === "spell" && (
              <SpellSession
                key={sessionKey}
                cards={practiceCards}
                onComplete={(s, tot) => handleComplete("spell", s, tot)}
              />
            )}
            {phase.mode === "match" && (
              <MatchSession
                key={sessionKey}
                cards={practiceCards}
                onComplete={(s, tot, ms) => handleComplete("match", s, tot, ms)}
              />
            )}
          </>
        )}

        {!isLoading && phase.tag === "writeSession" && (
          <SentenceWriteSession
            key={sessionKey}
            wordList={phase.wordList}
            constraints={phase.constraints}
            evaluateFn={evaluateSentence}
            language={locale}
            onComplete={(s, tot) => handleComplete("sentenceWrite", s, tot)}
          />
        )}

        {!isLoading && phase.tag === "fillSession" && (
          <SentenceFillSession
            key={sessionKey}
            sentences={phase.sentences}
            onComplete={(s, tot) => handleComplete("sentenceFill", s, tot)}
          />
        )}

        {/* Complete */}
        {phase.tag === "complete" && (
          <SessionComplete
            data={phase.data}
            onPlayAgain={handlePlayAgain}
            onChooseDifferent={handleChooseDifferent}
          />
        )}
      </div>
    </div>
  );
}
