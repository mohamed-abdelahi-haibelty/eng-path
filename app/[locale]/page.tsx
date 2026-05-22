"use client";

import { use } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Eyebrow } from "@/components/ui/eyebrow";
import { LevelCardSkeleton } from "@/components/skeletons/level-card-skeleton";
import { LEVEL_LIST, type LevelMeta, levelHref } from "@/lib/levels";
import { isLocale } from "@/i18n/routing";
import { ChevronRight, Languages, Zap } from "lucide-react";

function LevelCard({
  meta,
  locale,
  completedUnits,
  totalUnits,
}: {
  meta: LevelMeta;
  locale: "en" | "fr";
  completedUnits: number;
  totalUnits: number;
}) {
  const t = useTranslations("level");
  const progress =
    totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

  return (
    <Link href={levelHref(locale, meta.param)} className="group block rounded-xl">
      <article className="bg-card rounded-xl p-5 flex gap-4 border border-border group-hover:bg-muted/50 transition-colors duration-150 motion-reduce:transition-none">
        <p className="text-xl font-bold tracking-tight text-foreground leading-none pt-0.5 w-9 shrink-0">
          {meta.cefrCode}
        </p>
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <h2 className="text-sm font-semibold text-foreground leading-snug">
                {t(`${meta.param}.name`)}
              </h2>
              <span className="text-[0.75rem] tabular-nums text-muted-foreground shrink-0">
                {completedUnits}/{totalUnits}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {t(`${meta.param}.description`)}
            </p>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </article>
    </Link>
  );
}

export default function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeRaw } = use(params);
  if (!isLocale(localeRaw)) notFound();
  const locale = localeRaw;

  const router = useRouter();
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  const data = useQuery(api.queries.home.homeData, { language: locale });

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
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-4 w-40 mt-1" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {firstName
                    ? t("titleNamed", { name: firstName })
                    : t("title")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {data?.continueUnit
                    ? t("subtitleContinue", {
                        level: data.continueUnit.level,
                        unitNumber: data.continueUnit.unitNumber,
                      })
                    : t("subtitleReady")}
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors duration-150 hover:bg-muted text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none shrink-0"
            aria-label={t("switchLanguage")}
          >
            <Languages className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline uppercase tracking-wider font-semibold tabular-nums">
              {locale}
            </span>
          </button>
        </div>

        {!isLoading && data?.continueUnit && (
          <div className="bg-card rounded-xl p-5 flex items-start justify-between gap-4 border border-border">
            <div className="space-y-1 min-w-0">
              <Eyebrow as="p" size="sm">
                {data.continueUnit.level} · {t("continueLabel")}
              </Eyebrow>
              <p className="text-lg font-semibold text-foreground leading-snug truncate">
                {data.continueUnit.topic}
              </p>
              <p className="text-xs text-muted-foreground">
                {tCommon("continue")} {data.continueUnit.unitNumber}
              </p>
            </div>
            <Button
              render={
                <Link
                  href={`/${locale}/levels/${data.continueUnit.level.toLowerCase()}/${data.continueUnit.slug}`}
                />
              }
              nativeButton={false}
              size="sm"
              className="shrink-0 mt-0.5"
            >
              {t("continue")}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}

        <section aria-label={t("levelsHeading")}>
          {hasNoProgress && (
            <p className="text-sm font-medium text-foreground mb-5">
              {t("newHere")}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      locale={locale}
                      completedUnits={stats?.completedUnits ?? 0}
                      totalUnits={stats?.totalUnits ?? 30}
                    />
                  );
                })}
          </div>
        </section>

        {!isLoading && (data?.dueFlashcards ?? 0) > 0 && (
          <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-4 border border-border">
            <div className="flex items-center gap-2">
              <Zap
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-sm text-foreground">
                {data!.dueFlashcards === 100
                  ? t("flashcardsDueOver")
                  : t("flashcardsDue", { count: data!.dueFlashcards })}
              </p>
            </div>
            <Button
              render={<Link href={`/${locale}/flashcards`} />}
              nativeButton={false}
              variant="secondary"
              size="sm"
              className="shrink-0"
            >
              {tCommon("review")}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
