"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";

import { BackLink } from "@/components/ui/back-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { FlashcardStatsSkeleton } from "@/components/skeletons/flashcard-stats-skeleton";
import { isLocale } from "@/i18n/routing";

type StatsData = NonNullable<
  ReturnType<typeof useQuery<typeof api.queries.flashcards.deckStats>>
>;

const HEATMAP_LEVELS = [
  "bg-muted",
  "bg-accent/20",
  "bg-accent/40",
  "bg-accent/65",
  "bg-accent/90",
] as const;

function getCellClass(count: number, max: number): string {
  if (count === 0) return HEATMAP_LEVELS[0];
  const ratio = count / max;
  if (ratio < 0.25) return HEATMAP_LEVELS[1];
  if (ratio < 0.5) return HEATMAP_LEVELS[2];
  if (ratio < 0.75) return HEATMAP_LEVELS[3];
  return HEATMAP_LEVELS[4];
}

function Heatmap({
  data,
  todayKey,
}: {
  data: Array<{ date: string; count: number }>;
  todayKey: string;
}) {
  const t = useTranslations("flashcards.stats");
  const max = Math.max(...data.map((d) => d.count), 1);
  const firstDate = data[0]?.date;
  const padBefore = firstDate
    ? new Date(firstDate + "T00:00:00Z").getUTCDay()
    : 0;

  return (
    <div>
      <div
        className="grid gap-1 mb-1"
        style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
      >
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span
            key={i}
            className="text-center text-[0.5625rem] font-bold uppercase text-muted-foreground/60"
          >
            {d}
          </span>
        ))}
      </div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
      >
        {Array.from({ length: padBefore }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {data.map((cell) => (
          <div
            key={cell.date}
            title={`${cell.date}: ${cell.count}`}
            className={[
              "aspect-square rounded-sm transition-colors",
              getCellClass(cell.count, max),
              cell.date === todayKey ? "ring-1 ring-foreground/30" : "",
            ].join(" ")}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-4 justify-end">
        <span className="text-[0.5625rem] text-muted-foreground/60 font-bold uppercase tracking-wide">
          {t("less")}
        </span>
        {HEATMAP_LEVELS.map((cls) => (
          <div key={cls} className={`w-3 h-3 rounded-sm ${cls}`} />
        ))}
        <span className="text-[0.5625rem] text-muted-foreground/60 font-bold uppercase tracking-wide">
          {t("more")}
        </span>
      </div>
    </div>
  );
}

export default function FlashcardStatsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeRaw } = use(params);
  if (!isLocale(localeRaw)) notFound();
  const locale = localeRaw;

  const t = useTranslations("flashcards");
  const tStats = useTranslations("flashcards.stats");
  const tStates = useTranslations("flashcards.stats.states");

  const stats = useQuery(api.queries.flashcards.deckStats, { language: locale });

  const STATE_META: Array<{
    key: keyof StatsData["stateCounts"];
    label: string;
    desc: string;
  }> = [
    { key: "new", label: tStates("new"), desc: tStates("newLabel") },
    { key: "learning", label: tStates("learning"), desc: tStates("learningLabel") },
    { key: "review", label: tStates("review"), desc: tStates("reviewLabel") },
    { key: "relearning", label: tStates("relearning"), desc: tStates("relearningLabel") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-6 sm:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <BackLink href={`/${locale}/flashcards`}>{t("backToReview")}</BackLink>
        </div>

        <div className="mb-10">
          <Eyebrow as="span" size="sm">
            {t("dailyReview")}
          </Eyebrow>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-1 leading-tight">
            {tStats("title")}
          </h1>
        </div>

        {stats === undefined && <FlashcardStatsSkeleton />}

        {stats === null && (
          <p className="text-sm text-muted-foreground">
            {t("noCards")}
          </p>
        )}

        {stats && stats.total === 0 && (
          <div className="py-12 text-center space-y-3">
            <p className="text-base font-semibold text-foreground">
              {t("noCards")}
            </p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {t("noCardsSubtitle")}
            </p>
            <Link
              href={`/${locale}`}
              className="inline-block mt-2 text-sm font-semibold text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
            >
              {t("browseUnits")}
            </Link>
          </div>
        )}

        {stats && stats.total > 0 && (
          <div className="space-y-10">
            <div className="flex flex-wrap gap-x-8 gap-y-5">
              {[
                { label: tStats("dayStreak"), value: stats.streak },
                { label: tStats("dueToday"), value: stats.dueToday },
                { label: tStats("totalCards"), value: stats.total },
                { label: tStats("allReviews"), value: stats.totalReviews },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-2xl font-bold font-mono tabular-nums text-foreground leading-none">
                    {value}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <section>
              <Eyebrow as="h2" size="sm" className="mb-4">
                {tStats("deckBreakdown")}
              </Eyebrow>
              <div className="space-y-3.5">
                {STATE_META.map(({ key, label, desc }) => {
                  const count = stats.stateCounts[key];
                  const ratio = stats.total > 0 ? count / stats.total : 0;
                  return (
                    <div key={key} className="flex items-center gap-4">
                      <div className="w-28 shrink-0">
                        <p className="text-sm font-medium text-foreground leading-tight">
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {desc}
                        </p>
                      </div>
                      <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground/50 transition-all duration-500"
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono tabular-nums text-muted-foreground w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <Eyebrow as="h2" size="sm" className="mb-4">
                {tStats("last90")}
              </Eyebrow>
              <div className="rounded-xl border border-border bg-card p-4">
                <Heatmap data={stats.heatmap} todayKey={stats.todayKey} />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
