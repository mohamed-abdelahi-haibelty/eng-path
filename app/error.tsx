"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-6 sm:px-8 py-24 sm:py-32">
        <div className="space-y-8">
          <Eyebrow className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
            Error
          </Eyebrow>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              Something went wrong
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-md">
              An unexpected error occurred. Try again, and if the problem
              continues, head back to the homepage.
            </p>
            {process.env.NODE_ENV === "development" && error.digest && (
              <p className="text-xs text-muted-foreground font-mono mt-3">
                digest: {error.digest}
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button type="button" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </Button>
            <Button variant="ghost" render={<Link href="/" />}>
              Go home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
