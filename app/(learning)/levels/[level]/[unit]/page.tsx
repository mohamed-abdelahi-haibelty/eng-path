"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ModuleCard from "@/components/ModuleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BackLink } from "@/components/ui/back-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { UnitHeaderSkeleton } from "@/components/skeletons/unit-header-skeleton";
import { ModuleGridSkeleton } from "@/components/skeletons/module-grid-skeleton";
import { getLevelMeta } from "@/lib/levels";
import { CheckCircle2 } from "lucide-react";

export default function UnitPage({
  params,
}: {
  params: Promise<{ level: string; unit: string }>;
}) {
  const { level: levelRaw, unit: unitSlug } = use(params);
  const meta = getLevelMeta(levelRaw);

  if (!meta) notFound();

  const data = useQuery(api.queries.unit.unitBySlug, {
    level: meta.cefrCode,
    slug: unitSlug,
  });

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          <BackLink href={`/levels/${meta.param}`} className="mb-8">
            Back to {meta.name}
          </BackLink>
          <UnitHeaderSkeleton />
          <div className="mt-12">
            <Skeleton className="h-6 w-40 rounded mb-6" />
            <ModuleGridSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (data === null) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
        <BackLink href={`/levels/${meta.param}`} className="mb-8">
          Back to {meta.name}
        </BackLink>

        <div className="mb-8">
          <Eyebrow as="span" size="sm" className="mb-3 block">
            Unit {String(data.unitNumber).padStart(2, "0")} • {data.level}
          </Eyebrow>

          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-8 leading-tight">
            {data.topic}
          </h1>

          <div className="border-t border-border" />
        </div>

        <div>
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.modules.map((module) => (
                <ModuleCard
                  key={module.name}
                  module={module}
                  level={meta.param}
                  unitSlug={data.slug}
                />
              ))}
            </div>
          </div>

          {data.unitCompleted && (
            <div className="mt-4 pt-6 border-t border-border flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-state-success shrink-0" />
              <p className="text-sm text-foreground font-medium">
                Unit complete
              </p>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-border space-y-6">
            <Eyebrow as="h2" size="sm">About this unit</Eyebrow>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <Eyebrow as="p" size="sm" className="mb-2">
                  Knowledge Focus
                </Eyebrow>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {data.knowledgeFocus}
                </p>
              </div>
              <div>
                <Eyebrow as="p" size="sm" className="mb-2">
                  Grammar Point
                </Eyebrow>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {data.grammarPoint}
                </p>
              </div>
              <div>
                <Eyebrow as="p" size="sm" className="mb-2">
                  TOEFL Angle
                </Eyebrow>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {data.toeflAngle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
