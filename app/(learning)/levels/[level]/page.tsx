"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery, useConvexConnectionState } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppHeader } from "@/components/app-header";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  ChevronLeft,
  WifiOff,
  RotateCcw,
  ArrowRight,
} from "lucide-react";

const VALID_LEVELS = ["a1", "a2", "b1", "b2"] as const;
type LevelParam = typeof VALID_LEVELS[number];

const LEVEL_META: Record<
  LevelParam,
  { name: string; cefrCode: "A1" | "A2" | "B1" | "B2" }
> = {
  a1: { name: "Beginner", cefrCode: "A1" },
  a2: { name: "Elementary", cefrCode: "A2" },
  b1: { name: "Intermediate", cefrCode: "B1" },
  b2: { name: "Upper-Intermediate", cefrCode: "B2" },
};

function UnitRowSkeleton() {
  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <Skeleton className="h-3 w-5 mt-0.5 rounded shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-1 w-full rounded-full" />
      </div>
    </div>
  );
}

function FetchError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="col-span-2 px-5 py-10 flex flex-col items-center gap-4 text-center">
      <WifiOff className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          Could not load units
        </p>
        <p className="text-sm text-muted-foreground">
          Check your connection and try again.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

export default function LevelPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level: levelRaw } = use(params);
  const levelParam = levelRaw.toLowerCase() as LevelParam;

  if (!VALID_LEVELS.includes(levelParam)) {
    notFound();
  }

  const meta = LEVEL_META[levelParam];
  const data = useQuery(api.queries.units.unitsByLevel, {
    level: meta.cefrCode,
  });
  const { isWebSocketConnected } = useConvexConnectionState();

  const [hasConnected, setHasConnected] = useState(false);
  useEffect(() => {
    if (isWebSocketConnected) setHasConnected(true);
  }, [isWebSocketConnected]);

  const [timedOut, setTimedOut] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  useEffect(() => {
    if (data !== undefined) {
      setTimedOut(false);
      return;
    }
    const t = setTimeout(() => setTimedOut(true), 8_000);
    return () => clearTimeout(t);
  }, [data, retryKey]);

  const isLoading = data === undefined;
  const showError =
    timedOut || (hasConnected && !isWebSocketConnected && isLoading);

  function handleRetry() {
    setTimedOut(false);
    setRetryKey((k) => k + 1);
  }

  const completedCount = data?.units.filter((u) => u.unitCompleted).length ?? 0;
  const totalCount = data?.units.length ?? 30;
  // Index of the first unit not yet completed — used for "Next up" highlight
  const nextUpIndex = data?.units.findIndex((u) => !u.unitCompleted) ?? -1;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        left={
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Home
          </Link>
        }
      />

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Level heading + progress summary */}
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground leading-none">
                {meta.cefrCode}
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                {meta.name}
              </p>
            </div>
            <div className="text-right shrink-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-7 w-16 ml-auto" />
                  <Skeleton className="h-3 w-24 ml-auto mt-1.5" />
                </>
              ) : completedCount === totalCount && totalCount > 0 ? (
                <>
                  <p className="text-2xl font-bold tabular-nums text-state-success leading-none">
                    {totalCount}
                    <span className="text-base font-normal text-muted-foreground">
                      /{totalCount}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    all complete
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold tabular-nums text-foreground leading-none">
                    {completedCount}
                    <span className="text-base font-normal text-muted-foreground">
                      /{totalCount}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    units complete
                  </p>
                </>
              )}
            </div>
          </div>
          {/* Level-wide progress bar */}
          {isLoading ? (
            <Skeleton className="h-1.5 w-full rounded-full" />
          ) : (
            <Progress
              value={
                totalCount > 0
                  ? Math.round((completedCount / totalCount) * 100)
                  : 0
              }
              className="h-1.5"
              aria-label={`${completedCount} of ${totalCount} units complete`}
            />
          )}
        </div>

        {/* Unit grid: 2 columns on sm+, 1 column on mobile */}
        <section aria-label={`${meta.cefrCode} units`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
            {showError ? (
              <FetchError onRetry={handleRetry} />
            ) : isLoading ? (
              Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="bg-card">
                  <UnitRowSkeleton />
                </div>
              ))
            ) : !data ? (
              <FetchError onRetry={handleRetry} />
            ) : (
              data.units.map((unit, idx) => {
                const progress =
                  unit.totalModules > 0
                    ? Math.round(
                        (unit.completedModules / unit.totalModules) * 100,
                      )
                    : 0;
                const isNextUp = idx === nextUpIndex;
                const isDone = unit.unitCompleted;

                return (
                  <Link
                    key={unit._id}
                    href={`/units/${unit.slug}`}
                    aria-label={`Unit ${unit.unitNumber}: ${unit.topic}${
                      isDone ? ", completed" : isNextUp ? ", next up" : ""
                    }`}
                    className={[
                      "group block px-4 py-3 transition-colors duration-150 motion-reduce:transition-none",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                      isDone
                        ? "bg-card hover:bg-muted/40 opacity-60 hover:opacity-100"
                        : isNextUp
                        ? "bg-secondary hover:bg-muted"
                        : "bg-card hover:bg-muted/50",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unit number or done indicator */}
                      <span
                        className={[
                          "text-[0.6875rem] font-bold tabular-nums mt-0.5 w-5 shrink-0",
                          isDone ? "text-state-success" : "text-muted-foreground",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          String(unit.unitNumber).padStart(2, "0")
                        )}
                      </span>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={[
                              "text-[0.8125rem] font-medium truncate leading-snug",
                              isDone
                                ? "text-muted-foreground"
                                : "text-foreground",
                            ].join(" ")}
                          >
                            {unit.topic}
                          </p>
                          {isNextUp && (
                            <ArrowRight
                              className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors duration-150"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <Progress
                          value={progress}
                          className="h-1"
                          aria-label={`${unit.completedModules} of ${unit.totalModules} modules complete`}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
