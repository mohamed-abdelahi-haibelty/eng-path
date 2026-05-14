"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, ChevronRight, Zap } from "lucide-react";

const LEVEL_DEFS = [
  {
    code: "A1",
    name: "Beginner",
    description:
      "Build a foundation with everyday vocabulary, simple sentence structures, and basic conversational patterns.",
    href: "/levels/a1",
  },
  {
    code: "A2",
    name: "Elementary",
    description:
      "Expand into routine topics, past and future tenses, and short connected texts on familiar subjects.",
    href: "/levels/a2",
  },
  {
    code: "B1",
    name: "Intermediate",
    description:
      "Express opinions, handle most situations you might encounter while travelling, and write coherent texts.",
    href: "/levels/b1",
  },
  {
    code: "B2",
    name: "Upper-Intermediate",
    description:
      "Engage with complex texts, argue a position fluently, and demonstrate the proficiency TOEFL requires.",
    href: "/levels/b2",
  },
] as const;

function LevelCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-5 flex flex-col gap-4 border border-border">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-8 rounded" />
        <Skeleton className="h-3 w-10" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
      <Skeleton className="h-1 w-full rounded-full" />
    </div>
  );
}

function LevelCard({
  code,
  name,
  description,
  href,
  completedUnits,
  totalUnits,
}: {
  code: string;
  name: string;
  description: string;
  href: string;
  completedUnits: number;
  totalUnits: number;
}) {
  const progress =
    totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

  return (
    <Link href={href} className="group block rounded-xl">
      <article className="bg-card rounded-xl p-5 flex flex-col gap-4 border border-border group-hover:bg-muted/50 transition-colors duration-150 motion-reduce:transition-none">
        <div className="flex items-center justify-between">
          <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
            {code}
          </span>
          <span className="text-[0.75rem] tabular-nums text-muted-foreground">
            {completedUnits}/{totalUnits}
          </span>
        </div>
        <div className="flex-1 space-y-1">
          <h2 className="text-base font-semibold text-foreground leading-snug">
            {name}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
        <Progress value={progress} className="h-1" />
      </article>
    </Link>
  );
}

export default function HomePage() {
  const data = useQuery(api.queries.home.homeData);
  const { signOut } = useAuthActions();

  const isLoading = data === undefined;
  const user = data?.user;
  const firstName = user?.name?.split(" ")[0] ?? null;
  const hasNoProgress =
    !isLoading &&
    !data?.continueUnit &&
    (data?.levels?.every((l) => l.completedUnits === 0) ?? false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-12 flex items-center justify-end">
          <div className="flex items-center gap-2.5">
            {isLoading ? (
              <>
                <Skeleton className="h-4 w-20 hidden sm:block" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </>
            ) : (
              <>
                {firstName && (
                  <span className="hidden sm:block text-sm text-muted-foreground">
                    {firstName}
                  </span>
                )}
                <Avatar className="h-6 w-6">
                  {user?.image && (
                    <AvatarImage src={user.image} alt={user.name ?? "User"} />
                  )}
                  <AvatarFallback className="text-[0.6875rem] font-bold">
                    {firstName?.[0] ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-md transition-colors duration-150 hover:bg-muted text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                  aria-label="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

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
              <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Continue
              </p>
              <p className="text-sm font-medium text-foreground truncate mt-0.5">
                {data.continueUnit.level} · Unit {data.continueUnit.unitNumber}
                <span className="text-muted-foreground font-normal">
                  {" "}— {data.continueUnit.topic}
                </span>
              </p>
            </div>
            <Button
              render={<Link href={`/units/${data.continueUnit.slug}`} />}
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
              ? LEVEL_DEFS.map((l) => <LevelCardSkeleton key={l.code} />)
              : LEVEL_DEFS.map((levelDef) => {
                  const stats = data?.levels?.find(
                    (l) => l.level === levelDef.code,
                  );
                  return (
                    <LevelCard
                      key={levelDef.code}
                      code={levelDef.code}
                      name={levelDef.name}
                      description={levelDef.description}
                      href={levelDef.href}
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
                className="h-3.5 w-3.5 shrink-0 text-primary"
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
