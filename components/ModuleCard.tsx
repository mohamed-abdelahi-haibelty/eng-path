"use client";

import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

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

const MODULE_ICONS: Record<string, string> = {
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
        className="p-5 rounded-xl border border-border bg-card opacity-60 cursor-not-allowed"
        title={module.lockedReason}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{MODULE_ICONS[module.name]}</span>
            <h3 className="font-semibold text-foreground">{module.name}</h3>
          </div>
          <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>
        <p className="text-xs text-muted-foreground">
          {module.lockedReason}
        </p>
      </div>
    );
  }

  return (
    <Link href={href}>
      <div className="group p-5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{MODULE_ICONS[module.name]}</span>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {module.name}
            </h3>
          </div>
          {module.completed && (
            <span className="inline-block w-5 h-5 bg-state-success rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-3 h-3 text-card"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}
        </div>

        {scoreDisplay && (
          <div className="text-sm text-muted-foreground">
            Score: <span className="font-semibold text-foreground">{scoreDisplay}</span>
          </div>
        )}

        {!module.completed && (
          <div className="text-xs text-muted-foreground mt-2">
            Start learning →
          </div>
        )}
      </div>
    </Link>
  );
}
