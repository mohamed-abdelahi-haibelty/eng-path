"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface MicOrbProps {
  maxSeconds: number;
  onRecordingComplete: (blob: Blob) => void;
  onPermissionDenied: () => void;
}

export function MicOrb({ maxSeconds, onRecordingComplete, onPermissionDenied }: MicOrbProps) {
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onRecordingComplete);
  const onDeniedRef = useRef(onPermissionDenied);
  onCompleteRef.current = onRecordingComplete;
  onDeniedRef.current = onPermissionDenied;

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let unmounted = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch {
        onDeniedRef.current();
        return;
      }

      if (unmounted) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstart = () => {
        if (unmounted) return;
        setStarted(true);

        // Timer begins only after the recorder confirms it has started
        let count = 0;
        timerRef.current = setInterval(() => {
          count += 1;
          setElapsed(count);
          if (count >= maxSeconds) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            recorder.stop();
          }
        }, 1000);
      };

      recorder.onstop = () => {
        stream?.getTracks().forEach((t) => t.stop());
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (!unmounted) {
          // Single Blob from all chunks preserves the WebM container correctly
          const blob = new Blob(chunks, { type: mimeType });
          onCompleteRef.current(blob);
        }
      };

      // No timeslice — collect all data in one shot on stop.
      // Timeslices produce fragmented WebM headers that cause incorrect
      // duration metadata and slow/stretched playback in the browser.
      recorder.start();
    }

    void start();

    return () => {
      unmounted = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [maxSeconds]);

  const progressPct = Math.min((elapsed / maxSeconds) * 100, 100);

  return (
    <div
      className="flex flex-col items-center gap-5 select-none"
      style={{ "--orb": "oklch(0.78 0.006 80)" } as React.CSSProperties}
    >
      <div className="relative flex items-center justify-center w-50 h-50">
        {started && (
          <div
            className="orb-pulse absolute w-40 h-40 rounded-full pointer-events-none"
            style={{ background: "var(--orb)" }}
            aria-hidden="true"
          />
        )}

        <div
          className={[
            "relative w-40 h-40 rounded-full flex items-center justify-center",
            started ? "orb-breathe" : "opacity-60",
          ].join(" ")}
          style={{ background: "var(--orb)" }}
          aria-label={started ? "Recording in progress" : "Opening microphone…"}
        >
          <Mic className="w-10 h-10 text-foreground" aria-hidden="true" />
        </div>
      </div>

      {/* Progress track */}
      <div className="w-36 h-px rounded-full bg-border overflow-hidden -mt-2" aria-hidden="true">
        <div
          className="h-full bg-muted-foreground/60 transition-[width] duration-1000 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Timer / status */}
      <div className="h-5 flex items-center justify-center">
        {started ? (
          <span className="text-sm font-mono tabular-nums text-muted-foreground">
            {formatTime(elapsed)} / {formatTime(maxSeconds)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Opening microphone…</span>
        )}
      </div>

      {/* Stop early — only shown once recording is live */}
      {started && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={stopRecording}
          className="gap-1.5"
        >
          <Square className="w-3 h-3 fill-current" aria-hidden="true" />
          Stop early
        </Button>
      )}
    </div>
  );
}
