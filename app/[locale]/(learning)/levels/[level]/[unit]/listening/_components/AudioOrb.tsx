"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play, RotateCcw, Headphones } from "lucide-react";

type OrbPhase = "idle" | "playing" | "completed" | "exhausted";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface AudioOrbProps {
  audioUrl: string;
  initialListensUsed: number;
  onComplete: () => void;
}

function initialPhase(listensUsed: number): OrbPhase {
  if (listensUsed >= 2) return "exhausted";
  if (listensUsed >= 1) return "completed";
  return "idle";
}

export function AudioOrb({ audioUrl, initialListensUsed, onComplete }: AudioOrbProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const listensRef = useRef(initialListensUsed);
  const [phase, setPhase] = useState<OrbPhase>(() => initialPhase(initialListensUsed));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handlePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || listensRef.current >= 2) return;
    audio.currentTime = 0;
    void audio.play();
    setPhase("playing");
    setCurrentTime(0);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      const newCount = Math.min(listensRef.current + 1, 2);
      listensRef.current = newCount;
      setPhase(newCount >= 2 ? "exhausted" : "completed");
      onComplete();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [onComplete]);

  const isInteractive = phase === "idle" || phase === "completed";

  return (
    <>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div
        className="flex flex-col items-center gap-5 select-none"
        style={{ "--orb": "oklch(0.78 0.006 80)" } as React.CSSProperties}
      >
        <div className="relative flex items-center justify-center w-50 h-50">
          {/* Pulse ring: composited scale + opacity — no box-shadow */}
          {phase === "playing" && (
            <div
              className="orb-pulse absolute w-40 h-40 rounded-full pointer-events-none"
              style={{ background: "var(--orb)" }}
              aria-hidden="true"
            />
          )}

          <button
            onClick={isInteractive ? handlePlay : undefined}
            disabled={!isInteractive}
            aria-label={
              phase === "idle"
                ? "Play audio"
                : phase === "completed"
                ? "Listen again"
                : phase === "playing"
                ? "Audio playing"
                : "Maximum listens reached"
            }
            className={[
              "relative w-40 h-40 rounded-full",
              "flex items-center justify-center",
              "transition-opacity duration-300",
              phase === "playing" && "orb-breathe",
              isInteractive && "cursor-pointer hover:opacity-85 active:opacity-70",
              !isInteractive && "cursor-default pointer-events-none",
              phase === "exhausted" && "opacity-35",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ background: "var(--orb)" }}
          >
            {phase === "idle" && (
              <Play className="w-10 h-10 text-foreground fill-foreground ml-1" />
            )}
            {phase === "completed" && (
              <RotateCcw className="w-9 h-9 text-foreground" />
            )}
            {phase === "exhausted" && (
              <Headphones className="w-9 h-9 text-foreground" />
            )}
          </button>
        </div>

        {/* Progress track — shown during playback */}
        <div className="w-36 h-px rounded-full bg-border overflow-hidden -mt-2" aria-hidden="true">
          {phase === "playing" && (
            <div
              className="h-full bg-muted-foreground/60"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
            />
          )}
        </div>

        <div className="h-5 flex items-center justify-center">
          {phase === "playing" && duration > 0 && (
            <span className="text-sm font-mono tabular-nums text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}
          {phase === "playing" && duration === 0 && (
            <span className="text-sm text-muted-foreground">Loading…</span>
          )}
          {phase === "completed" && (
            <span className="text-sm text-muted-foreground">Listen again</span>
          )}
          {phase === "exhausted" && (
            <span className="text-sm text-muted-foreground">Max listens reached</span>
          )}
        </div>
      </div>
    </>
  );
}
