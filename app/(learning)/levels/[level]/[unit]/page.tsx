"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ModuleCard from "@/components/ModuleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, CheckCircle2 } from "lucide-react";

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

function HeaderSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-32 rounded" />
      <Skeleton className="h-12 w-96 rounded" />
      <div className="space-y-4 pt-6 border-t border-border">
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
    </div>
  );
}

function ModuleGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-lg" />
      ))}
    </div>
  );
}

export default function UnitPage({
  params,
}: {
  params: Promise<{ level: string; unit: string }>;
}) {
  const { level: levelRaw, unit: unitSlug } = use(params);
  const levelParam = levelRaw.toLowerCase() as LevelParam;

  if (!VALID_LEVELS.includes(levelParam)) {
    notFound();
  }

  const meta = LEVEL_META[levelParam];
  const data = useQuery(api.queries.unit.unitBySlug, {
    level: meta.cefrCode,
    slug: unitSlug,
  });

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          <Link
            href={`/levels/${levelParam}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to {meta.name}
          </Link>
          <HeaderSkeleton />
          <div className="mt-12">
            <Skeleton className="h-6 w-40 rounded mb-6" />
            <ModuleGridSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (data === null) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
        {/* Back link */}
        <Link
          href={`/levels/${levelParam}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {meta.name}
        </Link>

        {/* Unit Header - Notion-style document */}
        <div className="mb-12">
          {/* Unit badge */}
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Unit {String(data.unitNumber).padStart(2, "0")} • {data.level}
          </span>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-8 leading-tight">
            {data.topic}
          </h1>

          {/* Divider */}
          <div className="border-t border-border mb-8"></div>

          {/* Metadata - clean, readable */}
          <div className="grid grid-cols-1 gap-6 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Knowledge Focus
              </p>
              <p className="text-base text-foreground leading-relaxed max-w-2xl">
                {data.knowledgeFocus}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Grammar Point
              </p>
              <p className="text-base text-foreground leading-relaxed max-w-2xl">
                {data.grammarPoint}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                TOEFL Angle
              </p>
              <p className="text-base text-foreground leading-relaxed max-w-2xl">
                {data.toeflAngle}
              </p>
            </div>
          </div>
        </div>

        {/* Modules Section */}
        <div>
          <div className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
              Learning Path
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.modules.map((module) => (
                <ModuleCard
                  key={module.name}
                  module={module}
                  level={data.level.toLowerCase()}
                  unitSlug={data.slug}
                />
              ))}
            </div>
          </div>

          {/* Completion Status - subtle and integrated */}
          {data.unitCompleted && (
            <div className="mt-12 pt-8 border-t border-border flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-state-success shrink-0" />
              <p className="text-sm text-foreground font-medium">
                You have completed this unit
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
