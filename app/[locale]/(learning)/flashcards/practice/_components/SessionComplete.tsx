"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Shuffle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { CompletionData } from "./types";

function ScoreRing({ score, total }: { score: number; total: number }) {
  const pct = total > 0 ? score / total : 0;
  const isPerfect = score === total;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const [animDash, setAnimDash] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setAnimDash(pct * circ), 60);
    return () => clearTimeout(id);
  }, [pct, circ]);

  return (
    <div className="relative w-14 h-14 mx-auto">
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          strokeWidth="3"
          stroke="var(--muted)"
        />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${animDash} ${circ}`}
          stroke={isPerfect ? "var(--state-success)" : "var(--foreground)"}
          style={{
            transition:
              "stroke-dasharray 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[0.65rem] font-semibold tabular-nums text-foreground leading-none">
          {score}/{total}
        </span>
      </div>
    </div>
  );
}

export function SessionComplete({
  data,
  onPlayAgain,
  onChooseDifferent,
}: {
  data: CompletionData;
  onPlayAgain: () => void;
  onChooseDifferent: () => void;
}) {
  const t = useTranslations("flashcards.practice");
  const { mode, score, total, timeMs } = data;
  const isPerfect = score === total;

  return (
    <div className="py-12 text-center space-y-5">
      {mode !== "match" ? (
        <ScoreRing score={score} total={total} />
      ) : (
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Shuffle className="w-5 h-5 text-muted-foreground" />
        </div>
      )}

      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">
          {isPerfect && mode !== "match" ? t("perfectScore") : t("sessionDone")}
        </p>
        {mode !== "match" && (
          <p className="text-sm text-muted-foreground">
            {t("finalScore", { correct: score, total })}
          </p>
        )}
        {mode === "match" && timeMs && (
          <p className="text-sm text-muted-foreground">
            {t("timeTaken", { seconds: Math.round(timeMs / 1000) })}
          </p>
        )}
      </div>

      <div className="flex justify-center gap-3 pt-1">
        <Button variant="secondary" onClick={onPlayAgain}>
          <RotateCcw className="w-4 h-4" />
          {t("playAgain")}
        </Button>
        <Button variant="ghost" onClick={onChooseDifferent}>
          {t("chooseDifferent")}
        </Button>
      </div>
    </div>
  );
}
