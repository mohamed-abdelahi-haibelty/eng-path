"use client";

import Link from "next/link";
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
  type LucideIcon,
} from "lucide-react";
import type { UnitModule } from "@/lib/modules";

const ICONS: Record<string, LucideIcon> = {
  Grammar: BookOpen,
  Reading: FileText,
  Listening: Headphones,
  Writing: PenLine,
  Speaking: Mic2,
  Review: RotateCcw,
};

interface ModuleCardProps {
  module: UnitModule;
  level: string;
  unitSlug: string;
}

export default function ModuleCard({ module, level, unitSlug }: ModuleCardProps) {
  const Icon = ICONS[module.name] ?? FileText;
  const href = `/levels/${level}/${unitSlug}/${module.name.toLowerCase()}`;
  const scoreText =
    module.completed && module.score !== undefined
      ? `${Math.round(module.score)}%`
      : null;

  if (module.locked) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card opacity-50 cursor-not-allowed select-none"
        title={module.lockedReason}
        aria-disabled="true"
      >
        <Icon className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="flex-1 text-sm font-medium text-foreground truncate">
          {module.name}
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
          {module.name}
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
