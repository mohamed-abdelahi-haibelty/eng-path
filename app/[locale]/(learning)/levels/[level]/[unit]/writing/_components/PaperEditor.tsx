"use client";

import { useRef, useState } from "react";
import { Copy, Check } from "lucide-react";

interface PaperEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  maxWords: number;
  minWords: number;
  placeholder?: string;
  disabled?: boolean;
  showCounter?: boolean;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function PaperEditor({
  value,
  onChange,
  readOnly = false,
  maxWords,
  minWords,
  placeholder = "Begin writing here…",
  disabled = false,
  showCounter = true,
}: PaperEditorProps) {
  const wordCount = countWords(value);
  const overLimit = wordCount > maxWords;
  const underMin = wordCount < minWords && wordCount > 0;

  return (
    <div className="relative">
      {/* Left margin line — soft rose, notebook-style */}
      <div
        className="absolute top-0 bottom-6 left-14 w-px pointer-events-none"
        style={{ background: "oklch(0.82 0.06 15 / 0.3)" }}
        aria-hidden="true"
      />

      <textarea
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly || disabled}
        disabled={disabled}
        placeholder={placeholder}
        rows={14}
        className="w-full resize-none bg-background pl-18 pr-4 pt-2 pb-2 text-foreground outline-none placeholder:text-muted-foreground/40 disabled:cursor-not-allowed"
        style={{
          fontFamily: "var(--font-handwriting)",
          fontSize: "1.25rem",
          lineHeight: "1.65rem",
          caretColor: "var(--accent)",
        }}
      />

      {showCounter && (
        <div className="flex items-center justify-end mt-1 pr-1">
          <span
            className="text-xs tabular-nums font-mono select-none"
            style={{
              color: overLimit
                ? "var(--destructive)"
                : underMin
                  ? "var(--state-warning)"
                  : "var(--muted-foreground)",
            }}
          >
            {wordCount} / {maxWords} words
          </span>
        </div>
      )}
    </div>
  );
}

interface ReadOnlyPaperProps {
  text: string;
  maxWords?: number;
  minWords?: number;
  copyLabel?: string;
}

export function ReadOnlyPaper({ text, maxWords = 99999, minWords = 0, copyLabel = "Copy text" }: ReadOnlyPaperProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex justify-end mb-1">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
          aria-label={copyLabel}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" style={{ color: "var(--state-success)" }} />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <PaperEditor
        value={text}
        readOnly
        maxWords={maxWords}
        minWords={minWords}
        showCounter={false}
      />
    </div>
  );
}
