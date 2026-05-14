"use client";

import React from "react";
import Link from "next/link";
import { Lock, ChevronRight, CheckCircle2 } from "lucide-react";

interface Module {
  name: string;
  completed: boolean;
  score?: number;
  locked: boolean;
  lockedReason?: string;
}

interface ModuleCardProps {
  module: Module;
  level: string;
  unitSlug: string;
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  Grammar: "📚",
  Reading: "📖",
  Listening: "🎧",
  Writing: "✍️",
  Speaking: "🎤",
  Review: "🔄",
};

export default function ModuleCard({
  module,
  level,
  unitSlug,
}: ModuleCardProps) {
  const moduleParam = module.name.toLowerCase();
  const href = `/levels/${level}/${unitSlug}/${moduleParam}`;

  const getScoreDisplay = () => {
    if (!module.completed) return null;
    if (module.score === undefined) return "Completed";
    return `${Math.round(module.score)}%`;
  };

  const scoreDisplay = getScoreDisplay();

  if (module.locked) {
    return (
      <div
        className="px-4 py-3 rounded-lg border border-border bg-card/50 opacity-60 cursor-not-allowed"
        title={module.lockedReason}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-base">{MODULE_ICONS[module.name]}</span>
            <h3 className="font-medium text-sm text-foreground">{module.name}</h3>
          </div>
          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
        <p className="text-xs text-muted-foreground leading-snug">
          {module.lockedReason}
        </p>
      </div>
    );
  }

  return (
    <Link href={href}>
      <div className="group px-4 py-3 rounded-lg border border-transparent hover:border-border bg-card hover:bg-muted/40 transition-all duration-150 cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-base shrink-0">{MODULE_ICONS[module.name]}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                {module.name}
              </h3>
              {scoreDisplay && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {scoreDisplay}
                </p>
              )}
            </div>
          </div>

          {module.completed ? (
            <CheckCircle2 className="w-4 h-4 text-state-success shrink-0 ml-3" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-3 transition-colors" />
          )}
        </div>
      </div>
    </Link>
  );
}
