"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
    </svg>
  );
}

const features = [
  "Structured A1–B2 curriculum across grammar, reading, listening, and writing",
  "AI evaluation on writing and speaking exercises in real time",
  "Spaced-repetition flashcard review for vocabulary retention",
] as const;

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setIsPending(true);
    setError(null);
    try {
      await signIn("github", { redirectTo: "/" });
    } catch {
      setError("Something went wrong. Please try again.");
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <aside className="hidden lg:flex lg:w-[42%] bg-card flex-col justify-center p-14 border-r border-border">
        <div className="space-y-6 max-w-xs">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground leading-snug tracking-tight">
              Your path to TOEFL success.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A complete A1–B2 curriculum with AI feedback on writing and speaking.
            </p>
          </div>
          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <span className="text-sm text-foreground leading-snug">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Right panel */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-80 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Continue with your GitHub account to get started.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void handleSignIn()}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2.5 bg-primary text-primary-foreground font-semibold text-sm px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed motion-reduce:transition-none"
            >
              {isPending ? (
                <SpinnerIcon className="w-4 h-4 animate-spin" />
              ) : (
                <GithubIcon className="w-4 h-4" />
              )}
              {isPending ? "Signing in…" : "Continue with GitHub"}
            </button>

            {error && (
              <p className="text-sm text-destructive text-center" role="alert">
                {error}
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            By continuing, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </main>
    </div>
  );
}
