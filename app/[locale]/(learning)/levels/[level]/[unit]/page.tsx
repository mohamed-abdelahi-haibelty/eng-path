"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import ModuleCard from "@/components/ModuleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BackLink } from "@/components/ui/back-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { UnitHeaderSkeleton } from "@/components/skeletons/unit-header-skeleton";
import { ModuleGridSkeleton } from "@/components/skeletons/module-grid-skeleton";
import { getLevelMeta } from "@/lib/levels";
import { isLocale } from "@/i18n/routing";
import { CheckCircle2 } from "lucide-react";

export default function UnitPage({
  params,
}: {
  params: Promise<{ locale: string; level: string; unit: string }>;
}) {
  const { locale: localeRaw, level: levelRaw, unit: unitSlug } = use(params);
  if (!isLocale(localeRaw)) notFound();
  const locale = localeRaw;
  const meta = getLevelMeta(levelRaw);
  if (!meta) notFound();

  const t = useTranslations("unit");
  const tLevel = useTranslations("level");
  const tCommon = useTranslations("common");

  const data = useQuery(api.queries.unit.unitBySlug, {
    level: meta.cefrCode,
    slug: unitSlug,
  });

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          <BackLink href={`/${locale}/levels/${meta.param}`} className="mb-8">
            {tCommon("backTo", { target: tLevel(`${meta.param}.name`) })}
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
  if (data.language !== locale) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
        <BackLink href={`/${locale}/levels/${meta.param}`} className="mb-8">
          {tCommon("backTo", { target: tLevel(`${meta.param}.name`) })}
        </BackLink>

        <div className="mb-8">
          <Eyebrow as="span" size="sm" className="mb-3 block">
            {t("eyebrow", {
              number: String(data.unitNumber).padStart(2, "0"),
              level: data.level,
            })}
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
                  key={module.key}
                  module={module}
                  locale={locale}
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
                {t("complete")}
              </p>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-border space-y-6">
            <Eyebrow as="h2" size="sm">{t("about")}</Eyebrow>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <Eyebrow as="p" size="sm" className="mb-2">
                  {t("knowledgeFocus")}
                </Eyebrow>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {data.knowledgeFocus}
                </p>
              </div>
              <div>
                <Eyebrow as="p" size="sm" className="mb-2">
                  {t("grammarPoint")}
                </Eyebrow>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {data.grammarPoint}
                </p>
              </div>
              <div>
                <Eyebrow as="p" size="sm" className="mb-2">
                  {t("examAngle")}
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
