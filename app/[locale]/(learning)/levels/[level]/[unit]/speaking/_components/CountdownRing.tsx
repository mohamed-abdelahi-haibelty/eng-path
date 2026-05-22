"use client";

import { useEffect, useRef, useState } from "react";

interface CountdownRingProps {
  durationSeconds: number;
  onComplete: () => void;
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : String(sec);
}

const SIZE = 160;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CountdownRing({ durationSeconds, onComplete }: CountdownRingProps) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setRemaining(durationSeconds);
  }, [durationSeconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onCompleteRef.current();
      return;
    }
    const id = setTimeout(() => setRemaining((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const progress = remaining / durationSeconds;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      className="flex flex-col items-center gap-5 select-none"
      aria-label={`Think time: ${remaining} seconds remaining`}
    >
      <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-border"
          />
          {/* Progress arc */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="stroke-foreground/40 transition-[stroke-dashoffset] duration-1000 ease-linear"
            style={{
              // Respect reduced motion: instant jump instead of smooth sweep
              // The CSS transition handles the 1s animation per tick
            }}
          />
        </svg>

        {/* Center: remaining seconds */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-3xl font-mono font-semibold tabular-nums text-foreground leading-none">
            {formatSeconds(remaining)}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Think
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-56">
        Prepare your answer. Recording starts automatically.
      </p>
    </div>
  );
}
