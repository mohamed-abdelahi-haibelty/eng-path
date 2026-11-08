"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { ExerciseUnion } from "./grammar-types";

interface InputProps {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}

export function TextInput({
  value,
  onChange,
  disabled,
  placeholder,
}: InputProps & { placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder ?? "Your answer…"}
      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    />
  );
}

export function FillInTheBlank({
  exercise,
  value,
  onChange,
  disabled,
}: {
  exercise: Extract<ExerciseUnion, { type: "fill_in_the_blank" }>;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const sentence = exercise.sentence.replace("___", "________");

  if (exercise.options && exercise.options.length > 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground font-mono leading-7 bg-muted/60 px-3 py-2 rounded-lg">
          {sentence}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {exercise.options.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt)}
              className={`px-3 py-2 text-sm rounded-lg border text-left transition-colors ${
                value === opt
                  ? "border-primary bg-primary text-primary-foreground font-medium"
                  : "border-border bg-card text-foreground hover:bg-muted/60"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground font-mono leading-7 bg-muted/60 px-3 py-2 rounded-lg">
        {sentence}
      </p>
      <TextInput value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export function MultipleChoice({
  exercise,
  value,
  onChange,
  disabled,
}: {
  exercise: Extract<ExerciseUnion, { type: "multiple_choice" }>;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const options = [
    { key: "a", label: exercise.options.a },
    { key: "b", label: exercise.options.b },
    { key: "c", label: exercise.options.c },
    { key: "d", label: exercise.options.d },
  ];

  return (
    <div className="space-y-3">
      {exercise.sentence && (
        <p className="text-sm text-foreground leading-7 bg-muted/60 px-3 py-2 rounded-lg">
          {exercise.sentence}
        </p>
      )}
      <div className="space-y-2">
        {options.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(key)}
            className={`w-full flex items-start gap-3 px-3 py-2.5 text-sm rounded-lg border text-left transition-colors ${
              value === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted/60"
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <span
              className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-bold mt-0.5 ${
                value === key
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {key.toUpperCase()}
            </span>
            <span className="leading-5">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SentenceTransformation({
  exercise,
  value,
  onChange,
  disabled,
}: {
  exercise: Extract<ExerciseUnion, { type: "sentence_transformation" }>;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="bg-muted/60 px-3 py-2 rounded-lg space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Original
        </p>
        <p className="text-sm text-foreground leading-7">{exercise.original}</p>
        {exercise.prompt && (
          <p className="text-xs text-muted-foreground italic mt-1">
            {exercise.prompt}
          </p>
        )}
      </div>
      <TextInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder="Write the transformed sentence…"
      />
    </div>
  );
}

export function ErrorCorrection({
  exercise,
  value,
  onChange,
  disabled,
}: {
  exercise: Extract<ExerciseUnion, { type: "error_correction" }>;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="bg-muted/60 px-3 py-2 rounded-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Find and fix the error
        </p>
        <p className="text-sm text-foreground leading-7 line-through decoration-destructive/70">
          {exercise.incorrect}
        </p>
      </div>
      <TextInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder="Write the corrected sentence…"
      />
    </div>
  );
}

export function BuildASentence({
  exercise,
  value,
  onChange,
  disabled,
}: {
  exercise: Extract<ExerciseUnion, { type: "build_a_sentence" }>;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const availableIndices = exercise.scrambled
    .map((_, i) => i)
    .filter((i) => !selectedIndices.includes(i));

  const joinTokens = (indices: number[]) =>
    indices.reduce((acc, i, pos) => {
      const word = exercise.scrambled[i];
      if (pos === 0) return word;
      return word === "," || word === ";" || word === ":"
        ? acc + word
        : acc + " " + word;
    }, "");

  const handleSelect = (idx: number) => {
    if (disabled) return;
    const next = [...selectedIndices, idx];
    setSelectedIndices(next);
    onChange(joinTokens(next));
  };

  const handleRemove = (posInSeq: number) => {
    if (disabled) return;
    const next = selectedIndices.filter((_, i) => i !== posInSeq);
    setSelectedIndices(next);
    onChange(joinTokens(next));
  };

  const handleReset = () => {
    if (disabled) return;
    setSelectedIndices([]);
    onChange("");
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Word bank
        </p>
        <div className="flex flex-wrap gap-2">
          {availableIndices.map((idx) => {
            const token = exercise.scrambled[idx];
            const isPunct = token === "," || token === ";" || token === ":";
            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(idx)}
                className={`py-1.5 text-sm rounded-lg border border-border bg-card text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isPunct ? "px-2 font-bold text-muted-foreground" : "px-3"}`}
              >
                {token}
              </button>
            );
          })}
          {availableIndices.length === 0 && (
            <span className="text-xs text-muted-foreground italic">
              All words placed
            </span>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Your sentence
        </p>
        <div className="min-h-10 flex flex-wrap gap-2 p-3 rounded-lg border border-dashed border-border bg-muted/30">
          {selectedIndices.map((wordIdx, seqPos) => {
            const token = exercise.scrambled[wordIdx];
            const isPunct = token === "," || token === ";" || token === ":";
            return (
              <button
                key={seqPos}
                type="button"
                disabled={disabled}
                onClick={() => handleRemove(seqPos)}
                className={`py-1.5 text-sm rounded-lg border border-primary/30 bg-primary/8 text-foreground hover:bg-destructive/10 hover:border-destructive/30 transition-colors disabled:cursor-not-allowed ${isPunct ? "px-2 font-bold" : "px-3"}`}
                title="Click to remove"
              >
                {token}
              </button>
            );
          })}
          {selectedIndices.length === 0 && (
            <span className="text-xs text-muted-foreground italic self-center">
              Click words above to build your sentence
            </span>
          )}
        </div>
      </div>

      {selectedIndices.length > 0 && !disabled && (
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      )}
    </div>
  );
}
