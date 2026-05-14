"use client";

import Link from "next/link";
import { ChevronLeft, WifiOff, RotateCcw } from "lucide-react";

export default function LevelError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-12 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-card rounded-xl border border-border px-5 py-12 flex flex-col items-center gap-4 text-center">
          <WifiOff className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Something went wrong
            </p>
            <p className="text-sm text-muted-foreground">
              Could not load this level. Check your connection and try again.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </button>
        </div>
      </main>
    </div>
  );
}
