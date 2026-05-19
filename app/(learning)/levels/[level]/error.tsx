"use client";

import { useEffect } from "react";
import { BackLink } from "@/components/ui/back-link";
import { ErrorBanner } from "@/components/ui/error-banner";
import type { AppError } from "@/lib/errors";

export default function LevelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[LevelError]", error);
  }, [error]);

  const appError: AppError = {
    code: "NETWORK_ERROR",
    message: "Couldn't load this level. Check your connection and try again.",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-12 flex items-center">
          <BackLink href="/">Home</BackLink>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <ErrorBanner error={appError} onRetry={reset} />
        {process.env.NODE_ENV === "development" && error.digest && (
          <p className="text-xs text-muted-foreground font-mono pl-1">
            digest: {error.digest}
          </p>
        )}
      </main>
    </div>
  );
}
