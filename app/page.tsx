"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Eyebrow } from "@/components/ui/eyebrow";
import { LevelCardSkeleton } from "@/components/skeletons/level-card-skeleton";
import { LEVEL_LIST, type LevelMeta } from "@/lib/levels";
import { ChevronRight, Zap } from "lucide-react";

function LevelCard({
  meta,
  completedUnits,
  totalUnits,
}: {
  meta: LevelMeta;
  completedUnits: number;
  totalUnits: number;
}) {
  const progress =
    totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

  return (
    <Link href={meta.href} className="group block rounded-xl">
      <article className="bg-card rounded-xl p-5 flex flex-col gap-4 border border-border group-hover:bg-muted/50 transition-colors duration-150 motion-reduce:transition-none">
        <div className="flex items-center justify-between">
          <Eyebrow>{meta.cefrCode}</Eyebrow>
          <span className="text-[0.75rem] tabular-nums text-muted-foreground">
            {completedUnits}/{totalUnits}
          </span>
        </div>
        <div className="flex-1 space-y-1">
          <h2 className="text-base font-semibold text-foreground leading-snug">
            {meta.name}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {meta.description}
          </p>
        </div>
        <Progress value={progress} className="h-1" />
      </article>
    </Link>
  );
}

export default function HomePage() {
  const data = useQuery(api.queries.home.homeData);

  if (data === null) notFound();

  const isLoading = data === undefined;
  const user = data?.user;
  const firstName = user?.name?.split(" ")[0] ?? null;
  const hasNoProgress =
    !isLoading &&
    !data?.continueUnit &&
    (data?.levels?.every((l) => l.completedUnits === 0) ?? false);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="space-y-0.5">
          {isLoading ? (
            <>
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-4 w-40 mt-1" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Welcome back{firstName ? `, ${firstName}` : ""}.
              </h1>
              <p className="text-sm text-muted-foreground">
                {data?.continueUnit
                  ? `${data.continueUnit.level} · Unit ${data.continueUnit.unitNumber}`
                  : "Ready to start your journey."}
              </p>
            </>
          )}
        </div>

        {!isLoading && data?.continueUnit && (
          <div className="rounded-lg px-4 py-3 flex items-center justify-between gap-4 border border-border">
            <div className="min-w-0">
              <Eyebrow as="p" size="sm">Continue</Eyebrow>
              <p className="text-sm font-medium text-foreground truncate mt-0.5">
                {data.continueUnit.level} · Unit {data.continueUnit.unitNumber}
                <span className="text-muted-foreground font-normal">
                  {" "}— {data.continueUnit.topic}
                </span>
              </p>
            </div>
            <Button
              render={<Link href={`/units/${data.continueUnit.slug}`} />}
              nativeButton={false}
              size="sm"
              className="shrink-0"
            >
              Continue
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}

        <section aria-label="CEFR levels">
          {hasNoProgress && (
            <p className="text-sm text-muted-foreground mb-5">
              New here? Start with A1, or pick the level that matches your
              current English.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isLoading
              ? LEVEL_LIST.map((l) => <LevelCardSkeleton key={l.param} />)
              : LEVEL_LIST.map((meta) => {
                  const stats = data?.levels?.find(
                    (l) => l.level === meta.cefrCode,
                  );
                  return (
                    <LevelCard
                      key={meta.param}
                      meta={meta}
                      completedUnits={stats?.completedUnits ?? 0}
                      totalUnits={stats?.totalUnits ?? 30}
                    />
                  );
                })}
          </div>
        </section>

        {!isLoading && (data?.dueFlashcards ?? 0) > 0 && (
          <div className="rounded-lg px-4 py-3 flex items-center justify-between gap-4 border border-border">
            <div className="flex items-center gap-2">
              <Zap
                className="h-3.5 w-3.5 shrink-0 text-state-warning"
                aria-hidden="true"
              />
              <p className="text-sm text-foreground">
                <span className="font-medium">
                  {data!.dueFlashcards === 100
                    ? "100+"
                    : data!.dueFlashcards}{" "}
                  flashcard{data!.dueFlashcards === 1 ? "" : "s"}
                </span>
                <span className="text-muted-foreground"> due for review</span>
              </p>
            </div>
            <Button
              render={<Link href="/flashcards" />}
              nativeButton={false}
              variant="secondary"
              size="sm"
              className="shrink-0"
            >
              Review
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
