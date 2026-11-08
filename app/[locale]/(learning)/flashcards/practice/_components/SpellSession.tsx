"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SessionProgress } from "./SessionProgress";
import { normalise, shuffle } from "./utils";
import type { PracticeCard } from "./types";

const SPELL_COUNT = 10;

export function SpellSession({
  cards,
  onComplete,
}: {
  cards: PracticeCard[];
  onComplete: (score: number, total: number) => void;
}) {
  const t = useTranslations("flashcards.practice");
  const [wordList] = useState<PracticeCard[]>(() =>
    shuffle(cards).slice(0, SPELL_COUNT),
  );
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [hintCount, setHintCount] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const card = wordList[idx];

  useEffect(() => {
    if (!card) return;
    setInput("");
    setHintCount(0);
    setRevealed(false);
    setSubmitted(false);
    inputRef.current?.focus();
    if (!card.audioUrl) return;
    const audio = new Audio(card.audioUrl);
    audioRef.current = audio;
    audio.play().catch(() => null);
    return () => {
      audio.pause();
    };
  }, [card?.word]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReplay = () => {
    if (!card.audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(card.audioUrl);
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => null);
  };

  const hasAudio = !!card?.audioUrl;
  const hint = card ? card.word.slice(0, hintCount + 1) : "";

  const handleSubmit = () => {
    if (submitted || revealed || !card) return;
    setSubmitted(true);
    if (normalise(input) === normalise(card.word)) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleShowAnswer = () => {
    if (submitted) return;
    setRevealed(true);
  };

  const handleNext = () => {
    const nextIdx = idx + 1;
    if (nextIdx >= wordList.length) {
      onComplete(correctCount, wordList.length);
    } else {
      setIdx(nextIdx);
    }
  };

  const isCorrect =
    submitted && normalise(input) === normalise(card?.word ?? "");
  const done = submitted || revealed;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (!done) {
          e.preventDefault();
          handleSubmit();
        } else {
          e.preventDefault();
          handleNext();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [done, input, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!card) return null;

  return (
    <div className="space-y-4">
      <SessionProgress done={idx + 1} total={wordList.length} />

      <div className="rounded-xl border border-border bg-card px-6 py-8 text-center space-y-4">
        <p className="text-xs text-muted-foreground font-medium">
          {hasAudio ? t("spellHeading") : t("spellHeadingNoAudio")}
        </p>

        {hasAudio ? (
          <button
            onClick={handleReplay}
            className="mx-auto flex items-center gap-2 px-5 py-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {t("replayAudio")}
            </span>
          </button>
        ) : card.arabicTranslation ? (
          <div className="space-y-1.5">
            <p className="text-2xl font-bold text-foreground" dir="rtl" lang="ar">
              {card.arabicTranslation}
            </p>
            <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
              {card.partOfSpeech}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("spellClueLabel")}
            </p>
          </div>
        ) : (
          <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
            {card.partOfSpeech}
          </p>
        )}

        {done && (
          <div className="space-y-0.5">
            <p
              className={`text-2xl font-bold tracking-tight ${isCorrect ? "text-state-success" : revealed ? "text-foreground" : "text-destructive"}`}
            >
              {card.word}
            </p>
            <p className="font-mono text-sm text-muted-foreground">
              {card.phonetics}
            </p>
          </div>
        )}
      </div>

      {!done ? (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hintCount > 0 ? hint + "..." : t("spellPlaceholder")}
            className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <div className="flex gap-2">
            <button
              onClick={() =>
                setHintCount((h) => Math.min(h + 1, card.word.length - 1))
              }
              disabled={hintCount >= card.word.length - 1}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("hint")} {hintCount > 0 ? `(${hint})` : ""}
            </button>
            <button
              onClick={handleShowAnswer}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("showAnswer")}
            </button>
            <Button
              onClick={handleSubmit}
              disabled={input.trim().length === 0}
              className="flex-1"
            >
              {t("submit")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p
            className={`text-sm font-semibold ${isCorrect ? "text-state-success" : "text-destructive"}`}
          >
            {revealed
              ? t("theAnswerWas") + " " + card.word
              : isCorrect
                ? t("correct")
                : t("incorrect") + " — " + t("theAnswerWas") + " " + card.word}
          </p>
          <Button onClick={handleNext} className="w-full">
            {idx + 1 < wordList.length ? t("next") : t("sessionDone")}
          </Button>
        </div>
      )}
    </div>
  );
}
