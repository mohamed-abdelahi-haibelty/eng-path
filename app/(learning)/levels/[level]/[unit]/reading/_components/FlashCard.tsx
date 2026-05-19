"use client";

import { useState, useRef } from "react";
import { Volume2, Plus, Check, Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface FlashCardProps {
  word: string;
  phonetics: string;
  partOfSpeech: string;
  audioUrl: string;
  arabicTranslation: string | undefined;
  inDeck: boolean;
  vocabularyId: Id<"vocabulary">;
  onAddToFlashcards: (id: Id<"vocabulary">) => Promise<void>;
}

export function FlashCard({
  word,
  phonetics,
  partOfSpeech,
  audioUrl,
  arabicTranslation,
  inDeck,
  vocabularyId,
  onAddToFlashcards,
}: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(inDeck);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFlip = () => setFlipped((f) => !f);

  const handleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => null);
  };

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (added || adding) return;
    setAdding(true);
    await onAddToFlashcards(vocabularyId);
    setAdded(true);
    setAdding(false);
  };

  return (
    <div
      className="relative w-full cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{ perspective: "1000px" }}
      onClick={handleFlip}
      role="button"
      aria-label={flipped ? "Flip to front" : "Flip to see translation"}
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFlip()}
    >
      <div
        className="relative w-full transition-transform duration-400"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          height: "160px",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-xl border border-border bg-card flex flex-col items-center justify-center px-5 py-4 gap-2"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
            {partOfSpeech}
          </p>
          <p className="text-xl font-semibold text-foreground tracking-tight">
            {word}
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">
              {phonetics}
            </span>
            <button
              onClick={handleAudio}
              className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Play pronunciation"
            >
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <p className="text-[0.6875rem] text-muted-foreground/50 tracking-wide">tap to reveal</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-xl border border-border bg-card flex flex-col items-center justify-center px-5 py-4 gap-3"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {arabicTranslation ? (
            <p
              className="text-xl font-semibold text-foreground"
              dir="rtl"
              lang="ar"
            >
              {arabicTranslation}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Translation unavailable
            </p>
          )}

          <button
            onClick={handleAdd}
            disabled={added || adding}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              added
                ? "bg-muted text-muted-foreground cursor-default"
                : "bg-foreground text-card hover:opacity-90",
            ].join(" ")}
          >
            {adding ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : added ? (
              <Check className="w-3 h-3" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            {added ? "In flashcards" : "Add to Flashcards"}
          </button>
        </div>
      </div>
    </div>
  );
}
