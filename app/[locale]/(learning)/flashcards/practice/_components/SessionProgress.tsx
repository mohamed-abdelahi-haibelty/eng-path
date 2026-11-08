"use client";

import { useTranslations } from "next-intl";

export function SessionProgress({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  const t = useTranslations("flashcards.practice");
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <div className="mb-6">
      <div className="h-0.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-foreground/30 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-end mt-2">
        <span className="font-mono tabular-nums text-xs text-muted-foreground">
          {t("progress", { done, total })}
        </span>
      </div>
    </div>
  );
}
