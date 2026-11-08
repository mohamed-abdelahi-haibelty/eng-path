"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Lock,
  ChevronRight,
  Check,
  BookOpen,
  FileText,
  Headphones,
  PenLine,
  Mic2,
  RotateCcw,
  SpellCheck,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { UnitModule, ModuleKey } from "@/lib/modules";
import { moduleHref } from "@/lib/modules";

const ICONS: Record<ModuleKey, LucideIcon> = {
  grammar: BookOpen,
  conjugaison: Type,
  orthographe: SpellCheck,
  reading: FileText,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic2,
  review: RotateCcw,
};

interface ModuleCardProps {
  module: UnitModule;
  locale: "en" | "fr";
  level: string;
  unitSlug: string;
}

const LOCKED_REASON_KEY: Record<string, string> = {
  "complete-grammar": "completeGrammar",
  "complete-conjugaison": "completeConjugaison",
  "complete-orthographe": "completeOrthographe",
  "complete-reading": "completeReading",
  "complete-listening": "completeListening",
  "complete-writing": "completeWriting",
  "complete-speaking": "completeSpeaking",
  "grammar-threshold": "grammarThreshold",
  "conjugaison-threshold": "conjugaisonThreshold",
  "orthographe-threshold": "orthographeThreshold",
};

export default function ModuleCard({
  module,
  locale,
  level,
  unitSlug,
}: ModuleCardProps) {
  const t = useTranslations("unit.modules");
  const tLocked = useTranslations("unit.locked");
  const tCompleteMap: Record<string, string> = {
    "complete-grammar": t("grammar"),
    "complete-conjugaison": t("conjugaison"),
    "complete-orthographe": t("orthographe"),
    "complete-reading": t("reading"),
    "complete-listening": t("listening"),
    "complete-writing": t("writing"),
    "complete-speaking": t("speaking"),
  };

  const Icon = ICONS[module.key] ?? FileText;
  const href = moduleHref(locale, level, unitSlug, module.key);
  const name = t(module.key);
  const scoreText =
    module.completed && module.score !== undefined
      ? `${Math.round(module.score)}%`
      : null;

  let lockedTitle: string | undefined;
  if (module.locked && module.lockedReason) {
    if (module.lockedReason.startsWith("complete-")) {
      const target = tCompleteMap[module.lockedReason];
      lockedTitle = target ? tLocked("completeFirst", { module: target }) : undefined;
    } else {
      const key = LOCKED_REASON_KEY[module.lockedReason];
      if (key && key.endsWith("Threshold")) {
        lockedTitle = tLocked(key as "grammarThreshold");
      }
    }
  }

  if (module.locked) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card opacity-50 cursor-not-allowed select-none"
        title={lockedTitle}
        aria-disabled="true"
      >
        <Icon className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="flex-1 text-sm font-medium text-foreground truncate">
          {name}
        </span>
        <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={[
        "group flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card",
        "hover:bg-secondary transition-colors duration-150 motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      ].join(" ")}
    >
      <Icon
        className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors duration-150 motion-reduce:transition-none"
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug truncate">
          {name}
        </p>
        {scoreText && (
          <p className="text-xs text-muted-foreground mt-0.5">{scoreText}</p>
        )}
      </div>

      {module.completed ? (
        <Check
          className="w-4 h-4 text-muted-foreground shrink-0"
          aria-hidden="true"
        />
      ) : (
        <ChevronRight
          className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors duration-150 motion-reduce:transition-none"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}
