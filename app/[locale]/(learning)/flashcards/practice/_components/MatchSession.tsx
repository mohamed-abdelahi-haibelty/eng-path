"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { shuffle } from "./utils";
import type { PracticeCard } from "./types";

type MatchTile = {
  id: string;
  content: string;
  pairKey: number;
  type: "word" | "translation";
  lang: "ar" | undefined;
};

const MATCH_PAIRS = 4;

function buildMatchTiles(cards: PracticeCard[]): {
  left: MatchTile[];
  right: MatchTile[];
} | null {
  const withTranslation = cards.filter((c) => c.arabicTranslation);
  if (withTranslation.length < MATCH_PAIRS) return null;
  const chosen = shuffle(withTranslation).slice(0, MATCH_PAIRS);

  const left: MatchTile[] = shuffle(
    chosen.map((c, i) => ({
      id: `word-${i}`,
      content: c.word,
      pairKey: i,
      type: "word" as const,
      lang: undefined,
    })),
  );

  const right: MatchTile[] = shuffle(
    chosen.map((c, i) => ({
      id: `tr-${i}`,
      content: c.arabicTranslation!,
      pairKey: i,
      type: "translation" as const,
      lang: "ar" as const,
    })),
  );

  return { left, right };
}

export function MatchSession({
  cards,
  onComplete,
}: {
  cards: PracticeCard[];
  onComplete: (score: number, total: number, timeMs: number) => void;
}) {
  const t = useTranslations("flashcards.practice");
  const [tiles] = useState(() => buildMatchTiles(cards));
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const started = startTime !== null;
  const done = tiles && matched.size === MATCH_PAIRS;

  useEffect(() => {
    if (started && !done) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime!) / 1000));
      }, 500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, done, startTime]);

  useEffect(() => {
    if (done && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [done]);

  const handleTileClick = (tile: MatchTile) => {
    if (matched.has(tile.pairKey)) return;
    if (wrongFlash.size > 0) return;

    if (!startTime) setStartTime(Date.now());

    if (tile.type === "word") {
      setSelectedLeft(tile.id);
    } else {
      setSelectedRight(tile.id);
    }
  };

  useEffect(() => {
    if (!selectedLeft || !selectedRight || !tiles) return;

    const leftTile = tiles.left.find((t) => t.id === selectedLeft);
    const rightTile = tiles.right.find((t) => t.id === selectedRight);

    if (!leftTile || !rightTile) return;

    if (leftTile.pairKey === rightTile.pairKey) {
      const newMatched = new Set(matched);
      newMatched.add(leftTile.pairKey);
      setMatched(newMatched);
      setSelectedLeft(null);
      setSelectedRight(null);

      if (newMatched.size === MATCH_PAIRS && startTime) {
        const elapsed = Date.now() - startTime;
        setTimeout(() => onComplete(MATCH_PAIRS, MATCH_PAIRS, elapsed), 400);
      }
    } else {
      setWrongFlash(new Set([selectedLeft, selectedRight]));
      setTimeout(() => {
        setWrongFlash(new Set());
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 600);
    }
  }, [selectedLeft, selectedRight]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tiles) return null;

  const tileClass = (tile: MatchTile) => {
    if (matched.has(tile.pairKey))
      return "opacity-0 pointer-events-none transition-opacity duration-300";
    const isSelected = tile.id === selectedLeft || tile.id === selectedRight;
    const isWrong = wrongFlash.has(tile.id);
    return [
      "w-full rounded-xl border px-3 py-3 text-sm font-medium text-left transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      isWrong
        ? "border-destructive bg-destructive/8 text-foreground"
        : isSelected
          ? "border-foreground bg-muted text-foreground"
          : "border-border bg-card hover:bg-muted/60 text-foreground cursor-pointer",
    ].join(" ");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {t("matchHeading")}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: MATCH_PAIRS }).map((_, i) => (
              <div
                key={i}
                className={[
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  i < matched.size
                    ? "bg-foreground scale-110"
                    : "bg-muted border border-border",
                ].join(" ")}
              />
            ))}
          </div>
          {started && (
            <span className="font-mono tabular-nums text-sm text-muted-foreground">
              {t("matchTimer", { seconds: elapsed })}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          {tiles.left.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              disabled={matched.has(tile.pairKey)}
              className={tileClass(tile)}
            >
              {tile.content}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {tiles.right.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              disabled={matched.has(tile.pairKey)}
              className={tileClass(tile)}
              dir="rtl"
              lang="ar"
            >
              {tile.content}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
