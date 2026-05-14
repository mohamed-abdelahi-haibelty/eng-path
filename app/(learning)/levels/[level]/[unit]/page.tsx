"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ModuleCard from "@/components/ModuleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

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
    <div className="space-y-4">
      <Skeleton className="h-6 w-32 rounded" />
      <Skeleton className="h-10 w-64 rounded" />
      <div className="space-y-3 pt-4">
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
    </div>
  );
}

function ModuleGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/levels/${levelParam}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to {meta.name}
          </Link>
          <HeaderSkeleton />
          <div className="mt-8">
            <Skeleton className="h-6 w-40 rounded mb-4" />
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back link */}
        <Link
          href={`/levels/${levelParam}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {meta.name}
        </Link>

        {/* Unit Header */}
        <div className="mb-8">
          <div className="mb-4">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1 rounded-md">
              Unit {data.unitNumber} • {data.level}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {data.topic}
          </h1>

          <div className="space-y-3 text-sm">
            <div>
              <span className="font-semibold text-foreground">
                Knowledge Focus:
              </span>{" "}
              <span className="text-muted-foreground">{data.knowledgeFocus}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">Grammar Point:</span>{" "}
              <span className="text-muted-foreground">{data.grammarPoint}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">
                TOEFL Angle:
              </span>{" "}
              <span className="text-muted-foreground">{data.toeflAngle}</span>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Learning Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* Unit Completion Status */}
        {data.unitCompleted && (
          <div className="mt-8 p-4 bg-muted border border-border rounded-lg">
            <p className="text-sm font-semibold text-foreground flex items-center">
              <span className="inline-block w-2 h-2 bg-state-success rounded-full mr-2"></span>
              Unit completed!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
