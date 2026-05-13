"use client";

import { useAuthActions } from "@convex-dev/auth/react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 8l4 4 7-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — brand side */}
      <aside className="hidden lg:flex lg:w-[44%] bg-secondary flex-col justify-between p-12 border-r border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary border-b-2 border-brand-dark flex items-center justify-center">
            <BookIcon className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-extrabold text-[1rem] text-foreground tracking-tight">Eng Path</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-[2.25rem] font-extrabold text-foreground leading-[1.1] tracking-tight">
              Your path to<br />TOEFL success.
            </h1>
            <p className="text-[0.9375rem] text-muted-foreground leading-relaxed max-w-75">
              A complete A1–B2 curriculum with AI feedback on writing and speaking. Move at your own pace.
            </p>
          </div>

          <ul className="space-y-3.5">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckIcon />
                <span className="text-sm font-semibold text-secondary-foreground leading-snug">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs font-semibold text-muted-foreground">
          Free to use. No credit card required.
        </p>
      </aside>

      {/* Right panel — auth */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary border-b-[3px] border-brand-dark flex items-center justify-center">
            <BookIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-extrabold text-lg text-foreground tracking-tight">Eng Path</span>
        </div>

        <div className="w-full max-w-85 space-y-7">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome</h2>
            <p className="text-sm text-muted-foreground">
              Sign in with GitHub to start your learning journey.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void signIn("github", { redirectTo: "/" })}
            className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-brand-dark text-primary-foreground font-bold text-sm px-6 py-3.5 rounded-xl border-b-4 border-brand-dark transition-[background-color,transform,border-bottom-width] duration-100 ease-out active:translate-y-0.75 active:border-b focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:active:translate-y-0 cursor-pointer"
          >
            <GithubIcon className="w-5 h-5" />
            Continue with GitHub
          </button>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            By continuing, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </main>
    </div>
  );
}
