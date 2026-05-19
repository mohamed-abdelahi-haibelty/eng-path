"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppHeader } from "@/components/app-header";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BackLink } from "@/components/ui/back-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { UnitRowSkeleton } from "@/components/skeletons/unit-row-skeleton";
import { getLevelMeta } from "@/lib/levels";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function LevelPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level: levelRaw } = use(params);
  const meta = getLevelMeta(levelRaw);

  if (!meta) notFound();

  const data = useQuery(api.queries.units.unitsByLevel, {
    level: meta.cefrCode,
  });

  const isLoading = data === undefined;
  const completedCount =
    data?.units?.filter((u) => u.unitCompleted).length ?? 0;
  const totalCount = data?.units?.length ?? 0;
  const nextUpIndex = data?.units?.findIndex((u) => !u.unitCompleted) ?? -1;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount && totalCount > 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader left={<BackLink href="/">Home</BackLink>} />

      <main className="max-w-2xl mx-auto px-8 pt-14 pb-24">
        <header className="mb-10">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground leading-none">
            {meta.cefrCode}
          </h1>
          <p className="mt-3 text-base text-muted-foreground font-medium">
            {meta.name}
          </p>

          <div className="mt-8 pt-6 border-t border-border space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <Eyebrow>Progress</Eyebrow>
              {isLoading ? (
                <Skeleton className="h-3 w-20" />
              ) : (
                <span
                  className={[
                    "text-xs tabular-nums font-medium",
                    allDone ? "text-state-success" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {allDone
                    ? "All complete"
                    : `${completedCount} / ${totalCount} units`}
                </span>
              )}
            </div>
            {isLoading ? (
              <Skeleton className="h-1 w-full rounded-full" />
            ) : (
              <Progress
                value={progressPct}
                className="h-1"
                aria-label={`${completedCount} of ${totalCount} units complete`}
              />
            )}
          </div>
        </header>

        <section aria-label={`${meta.cefrCode} units`}>
          <Eyebrow as="p" className="mb-3">
            Units
          </Eyebrow>

          {isLoading ? (
            <div>
              {Array.from({ length: 8 }, (_, i) => (
                <UnitRowSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data?.units.map((unit, idx) => {
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
                    href={`/levels/${meta.param}/${unit.slug}`}
                    aria-label={`Unit ${unit.unitNumber}: ${unit.topic}${
                      isDone ? ", completed" : isNextUp ? ", next up" : ""
                    }`}
                    className={[
                      "group flex items-center gap-4 px-3 py-3.5 rounded-lg",
                      "transition-colors duration-150 motion-reduce:transition-none",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isDone
                        ? "opacity-60 hover:opacity-90 hover:bg-muted/40"
                        : isNextUp
                        ? "hover:bg-secondary"
                        : "hover:bg-muted/40",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "w-5 shrink-0 flex items-center justify-center",
                        isDone
                          ? "text-state-success"
                          : "text-[0.6875rem] font-bold tabular-nums text-muted-foreground",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        String(unit.unitNumber).padStart(2, "0")
                      )}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p
                        className={[
                          "text-sm font-semibold leading-snug truncate",
                          isDone ? "text-muted-foreground" : "text-foreground",
                        ].join(" ")}
                      >
                        {unit.topic}
                      </p>
                      {!isDone && unit.totalModules > 0 && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <Progress
                            value={progress}
                            className="h-px flex-1 max-w-20"
                            aria-hidden="true"
                          />
                          <span className="text-[0.625rem] text-muted-foreground tabular-nums shrink-0">
                            {unit.completedModules}/{unit.totalModules}
                          </span>
                        </div>
                      )}
                    </div>

                    {isNextUp && (
                      <ArrowRight
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors duration-150 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
