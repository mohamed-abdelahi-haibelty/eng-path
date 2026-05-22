"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { FlashCard } from "./FlashCard";

interface VocabWord {
  _id: Id<"vocabulary">;
  word: string;
  partOfSpeech: string;
  phonetics: string;
  audioUrl: string;
  arabicTranslation: string | undefined;
  inDeck: boolean;
}

interface VocabCarouselProps {
  words: VocabWord[];
  onAddToFlashcards: (id: Id<"vocabulary">) => Promise<void>;
}

export function VocabCarousel({ words, onAddToFlashcards }: VocabCarouselProps) {
  const [index, setIndex] = useState(0);

  if (words.length === 0) return null;

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(words.length - 1, i + 1));

  const current = words[index];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={prev}
          disabled={index === 0}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Previous word"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>

        <div className="flex-1 mx-4">
          <FlashCard
            key={current._id}
            vocabularyId={current._id}
            word={current.word}
            phonetics={current.phonetics}
            partOfSpeech={current.partOfSpeech}
            audioUrl={current.audioUrl}
            arabicTranslation={current.arabicTranslation}
            inDeck={current.inDeck}
            onAddToFlashcards={onAddToFlashcards}
          />
        </div>

        <button
          onClick={next}
          disabled={index === words.length - 1}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Next word"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-muted-foreground font-mono tabular-nums">
          {index + 1} / {words.length}
        </span>
        <div className="flex gap-1.5">
          {words.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={[
                "rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
                i === index
                  ? "w-4 h-1.5 bg-foreground"
                  : "w-1.5 h-1.5 bg-border hover:bg-muted-foreground",
              ].join(" ")}
              aria-label={`Go to word ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
