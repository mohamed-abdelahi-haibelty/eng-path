"use client";

import Link from "next/link";
import { BookOpen, Layers, Pencil, Shuffle, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { Mode, PracticeCard } from "./types";

type ModeConfig = {
  id: Mode;
  icon: React.ReactNode;
  ai?: boolean;
  minCards: number;
};

const MODE_CONFIGS: ModeConfig[] = [
  { id: "multipleChoice", icon: <Layers className="w-4 h-4" />, minCards: 4 },
  { id: "spell", icon: <Volume2 className="w-4 h-4" />, minCards: 1 },
  { id: "match", icon: <Shuffle className="w-4 h-4" />, minCards: 4 },
  {
    id: "sentenceFill",
    icon: <BookOpen className="w-4 h-4" />,
    ai: true,
    minCards: 1,
  },
  {
    id: "sentenceWrite",
    icon: <Pencil className="w-4 h-4" />,
    ai: true,
    minCards: 1,
  },
];

const MODE_TITLE_KEYS: Record<Mode, string> = {
  multipleChoice: "modeMultipleChoice",
  spell: "modeSpell",
  match: "modeMatch",
  sentenceFill: "modeSentenceFill",
  sentenceWrite: "modeSentenceWrite",
};

const MODE_DESC_KEYS: Record<Mode, string> = {
  multipleChoice: "modeMultipleChoiceDesc",
  spell: "modeSpellDesc",
  match: "modeMatchDesc",
  sentenceFill: "modeSentenceFillDesc",
  sentenceWrite: "modeSentenceWriteDesc",
};

export function PracticeHub({
  cards,
  onSelect,
  locale,
}: {
  cards: PracticeCard[];
  onSelect: (mode: Mode) => void;
  locale: "en" | "fr";
}) {
  const t = useTranslations("flashcards.practice");
  const tFlash = useTranslations("flashcards");

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t("deckCount", { count: cards.length })}
      </p>

      {cards.length < 4 && (
        <div className="rounded-xl border border-border bg-card p-5 text-sm space-y-2">
          <p className="font-semibold text-foreground">{t("notEnoughCards")}</p>
          <p className="text-xs text-muted-foreground">{t("addMoreCards")}</p>
          <Button
            variant="secondary"
            render={<Link href={`/${locale}`} />}
            className="mt-1"
          >
            {tFlash("browseUnits")}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {MODE_CONFIGS.map((cfg) => {
          const disabled = cards.length < cfg.minCards;
          const isWide = cfg.id === "sentenceWrite";

          return (
            <button
              key={cfg.id}
              disabled={disabled}
              onClick={() => !disabled && onSelect(cfg.id)}
              className={[
                "group rounded-xl border border-border bg-card text-left transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                disabled
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-muted/60 cursor-pointer",
                isWide
                  ? "col-span-2 flex items-center gap-4 px-5 py-4"
                  : "p-5",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {isWide ? (
                <>
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {t(MODE_TITLE_KEYS[cfg.id])}
                      </p>
                      {cfg.ai && (
                        <span className="shrink-0 text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
                          {t("aiLabel")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {t(MODE_DESC_KEYS[cfg.id])}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                      {cfg.icon}
                    </div>
                    {cfg.ai && (
                      <span className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
                        {t("aiLabel")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {t(MODE_TITLE_KEYS[cfg.id])}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    {t(MODE_DESC_KEYS[cfg.id])}
                  </p>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
