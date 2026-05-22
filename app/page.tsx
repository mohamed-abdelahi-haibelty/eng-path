"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { ArrowUpRight, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type LangCode = "en" | "fr";

interface LangCopy {
  code: LangCode;
  name: string;
  tagline: string;
  scope: string;
}

// Bilingual content is static — by design. The picker shows each option in
// its own language so a user who knows only French can identify their choice.
const COPY: Record<LangCode, LangCopy> = {
  en: {
    code: "en",
    name: "English",
    tagline: "Build your TOEFL track.",
    scope: "4 CEFR levels · 120 units.",
  },
  fr: {
    code: "fr",
    name: "Français",
    tagline: "Préparation DELF/DALF.",
    scope: "4 niveaux CECR · 120 unités.",
  },
};

function setLocaleCookie(code: LangCode) {
  // 1-year lifetime matches the routing config.
  document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

function formatLastStudied(ts: number | null, locale: LangCode): string | null {
  if (!ts) return null;
  const days = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
  if (locale === "fr") {
    if (days <= 0) return "aujourd'hui";
    if (days === 1) return "hier";
    return `il y a ${days} jours`;
  }
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function PickerRow({
  copy,
  totalUnits,
  completedUnits,
  lastUpdatedAt,
  onPick,
  pendingCode,
}: {
  copy: LangCopy;
  totalUnits: number;
  completedUnits: number;
  lastUpdatedAt: number | null;
  onPick: () => void;
  pendingCode: LangCode | null;
}) {
  const isPending = pendingCode === copy.code;
  const isOtherPending = pendingCode !== null && pendingCode !== copy.code;
  const newLabel = copy.code === "fr" ? "Nouveau" : "New";
  const percent =
    totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
  const lastStudied = formatLastStudied(lastUpdatedAt, copy.code);
  const hasProgress = completedUnits > 0;

  return (
    <button
      type="button"
      onClick={onPick}
      className={[
        "group w-full text-left py-10 sm:py-12 px-1",
        "transition-colors duration-150 motion-reduce:transition-none",
        isPending
          ? "bg-muted/60"
          : isOtherPending
            ? "opacity-50 pointer-events-none"
            : "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
      ].join(" ")}
    >
      <div className="max-w-2xl mx-auto px-6 sm:px-8 flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h2
            lang={copy.code}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-none"
          >
            {copy.name}
          </h2>
          <p
            lang={copy.code}
            className="mt-3 text-sm sm:text-[0.9375rem] text-muted-foreground leading-relaxed"
          >
            {copy.tagline} {copy.scope}
          </p>
          <p className={["mt-4 tabular-nums", hasProgress ? "text-sm font-medium text-foreground" : "text-xs text-muted-foreground"].join(" ")}>
            {hasProgress
              ? lastStudied
                ? `${percent}% · ${lastStudied}`
                : `${percent}%`
              : newLabel.toLowerCase()}
          </p>
        </div>
        {isPending ? (
          <span
            className="h-4 w-4 shrink-0 mt-1.5 rounded-full border-2 border-border border-t-foreground motion-safe:animate-spin"
            aria-hidden="true"
          />
        ) : (
          <ArrowUpRight
            className={[
              "h-4 w-4 shrink-0 mt-1.5 text-muted-foreground",
              "transition-transform duration-150 motion-reduce:transition-none",
              !isOtherPending &&
                "group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden="true"
          />
        )}
      </div>
      {hasProgress && (
        <div className="max-w-2xl mx-auto w-full px-6 sm:px-8 mt-6" aria-hidden="true">
          <div className="h-px bg-border overflow-hidden">
            <div className="h-full bg-foreground/20" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}
    </button>
  );
}

function PickerRowSkeleton() {
  return (
    <div className="py-10 sm:py-12 px-1">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-4 w-4 mt-1.5" />
      </div>
    </div>
  );
}

function WarmNote({
  overview,
}: {
  overview: { en: { completedUnits: number }; fr: { completedUnits: number } };
}) {
  const enDone = overview.en.completedUnits;
  const frDone = overview.fr.completedUnits;
  const total = enDone + frDone;
  if (total === 0) return null;

  const note =
    total === 1
      ? "You completed your first unit."
      : `You completed ${total} units.`;

  return (
    <p className="mt-3 text-sm text-muted-foreground">{note}</p>
  );
}

export default function PickerPage() {
  const router = useRouter();
  const overview = useQuery(api.queries.home.languageOverview);
  const { signOut } = useAuthActions();
  const [pending, setPending] = useState<LangCode | null>(null);

  // Prefetch both locale destinations.
  useEffect(() => {
    router.prefetch("/en");
    router.prefetch("/fr");
  }, [router]);

  const pick = (code: LangCode) => {
    if (pending) return;
    setPending(code);
    setLocaleCookie(code);
    router.push(`/${code}`);
  };

  const firstName = overview?.user.name?.split(" ")[0] ?? null;
  const isLoading = overview === undefined;
  const isError = overview === null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 h-12 flex items-center justify-end">
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-md transition-colors duration-150 hover:bg-muted text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="max-w-2xl mx-auto w-full px-6 sm:px-8 pt-10 sm:pt-14 pb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            {isLoading ? (
              <Skeleton className="h-10 w-64" />
            ) : firstName ? (
              <>Welcome back, {firstName}.</>
            ) : (
              <>Welcome back.</>
            )}
          </h1>
          {!isLoading && !pending && overview && (
            <WarmNote overview={overview} />
          )}
        </section>

        <div className="border-t border-border" />

        {isLoading ? (
          <>
            <PickerRowSkeleton />
            <div className="border-t border-border" />
            <PickerRowSkeleton />
            <div className="border-t border-border" />
          </>
        ) : isError ? (
          <section className="max-w-2xl mx-auto w-full px-6 sm:px-8 py-10">
            <p className="text-sm text-foreground">
              Something went wrong loading your data.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors duration-150 motion-reduce:transition-none"
            >
              Reload
            </button>
          </section>
        ) : (
          <>
            <PickerRow
              copy={COPY.en}
              totalUnits={overview?.en.totalUnits ?? 120}
              completedUnits={overview?.en.completedUnits ?? 0}
              lastUpdatedAt={overview?.en.lastUpdatedAt ?? null}
              onPick={() => pick("en")}
              pendingCode={pending}
            />
            <div className="border-t border-border" />
            <PickerRow
              copy={COPY.fr}
              totalUnits={overview?.fr.totalUnits ?? 120}
              completedUnits={overview?.fr.completedUnits ?? 0}
              lastUpdatedAt={overview?.fr.lastUpdatedAt ?? null}
              onPick={() => pick("fr")}
              pendingCode={pending}
            />
            <div className="border-t border-border" />
          </>
        )}

        {pending && (
          <p
            role="status"
            aria-live="polite"
            className="sr-only"
          >
            {pending === "fr" ? "Chargement…" : "Loading…"}
          </p>
        )}
      </main>
    </div>
  );
}
