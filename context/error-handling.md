# Global Error Handling System

## Next.js + Convex — Production-Grade Convention

> **For Claude Code**: This document is the single source of truth for all error handling in this project. Every function, API route, Convex mutation/query, and React component must follow these conventions exactly. Do not deviate.

---

## 1. Error Taxonomy

All errors in this project belong to one of these categories. Use the exact `code` strings — they are safe to expose in production.

```typescript
// lib/errors.ts

export type ErrorCode =
  // Auth
  | "UNAUTHORIZED" // Not logged in
  | "FORBIDDEN" // Logged in but no permission
  // Validation
  | "VALIDATION_ERROR" // Invalid input shape/value
  | "NOT_FOUND" // Resource does not exist
  // Business logic
  | "CONFLICT" // e.g. duplicate entry
  | "PRECONDITION_FAILED" // e.g. score too low to unlock
  // External / infra
  | "NETWORK_ERROR" // Fetch/connection failure
  | "DATABASE_ERROR" // Convex internal error
  | "EXTERNAL_SERVICE_ERROR" // Third-party API failure
  // Catch-all
  | "INTERNAL_ERROR"; // Unexpected — never expose details in prod

export interface AppError {
  code: ErrorCode;
  message: string; // Safe, user-facing message
  details?: unknown; // Dev-only, never rendered in prod UI
  field?: string; // For VALIDATION_ERROR — which field
}

export class AppException extends Error {
  readonly code: ErrorCode;
  readonly userMessage: string;
  readonly field?: string;

  constructor(
    code: ErrorCode,
    userMessage: string,
    options?: { field?: string; cause?: unknown },
  ) {
    super(userMessage);
    this.name = "AppException";
    this.code = code;
    this.userMessage = userMessage;
    this.field = options?.field;
    if (options?.cause) this.cause = options.cause;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isAppException(err: unknown): err is AppException {
  return err instanceof AppException;
}

/** Converts any unknown thrown value into a safe AppError object */
export function normalizeError(err: unknown): AppError {
  if (isAppException(err)) {
    return {
      code: err.code,
      message: err.userMessage,
      field: err.field,
    };
  }

  if (err instanceof Error) {
    // Convex surfaces errors as plain Error with a message
    // Never expose the raw message in production
    return {
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
  };
}

/** User-facing labels for each error code */
export const ERROR_LABELS: Record<ErrorCode, string> = {
  UNAUTHORIZED: "Please sign in to continue.",
  FORBIDDEN: "You don't have permission to do this.",
  VALIDATION_ERROR: "Please check your input and try again.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  CONFLICT: "This already exists.",
  PRECONDITION_FAILED: "You haven't met the requirements for this action.",
  NETWORK_ERROR: "Network error. Check your connection and try again.",
  DATABASE_ERROR: "A database error occurred. Please try again.",
  EXTERNAL_SERVICE_ERROR:
    "An external service is unavailable. Try again later.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
};
```

---

## 2. Convex Error Convention

### Mutations — always throw `AppException`

```typescript
// convex/mutations/example.ts
import { AppException } from "../lib/errors"; // adjust path
import { mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const submitScore = mutation({
  args: { unitId: v.id("units"), score: v.number() },
  handler: async (ctx, args) => {
    // ── Auth ──────────────────────────────────────────────────
    const userId = await getAuthUserId(ctx);
    if (!userId)
      throw new AppException(
        "UNAUTHORIZED",
        "Please sign in to submit your score.",
      );

    // ── Validation ────────────────────────────────────────────
    if (args.score < 0 || args.score > 100) {
      throw new AppException(
        "VALIDATION_ERROR",
        "Score must be between 0 and 100.",
        { field: "score" },
      );
    }

    // ── Existence check ───────────────────────────────────────
    const unit = await ctx.db.get(args.unitId);
    if (!unit) throw new AppException("NOT_FOUND", "Unit not found.");

    // ── Business logic ────────────────────────────────────────
    // ... your logic here

    return { success: true };
  },
});
```

### Queries — return `null` for not-found, throw for auth

```typescript
// convex/queries/example.ts

export const grammarBySlug = query({
  args: { level: LEVEL_VALIDATOR, slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null; // queries return null — never throw for unauth

    const unit = await ctx.db
      .query("units")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!unit || unit.level !== args.level) return null;

    // ... rest of query
  },
});
```

> **Rule**: Queries return `null` for missing/unauthorized data (the client handles `null → notFound()`). Mutations throw `AppException` because they have side effects and must communicate failure clearly.

---

## 3. React / Client-Side Error Handling

### 3.1 The `useAction` hook — wrap all mutations

```typescript
// hooks/use-action.ts
"use client";

import { useState, useCallback } from "react";
import { normalizeError, type AppError } from "@/lib/errors";

interface ActionState<T> {
  data: T | null;
  error: AppError | null;
  isLoading: boolean;
}

interface UseActionReturn<TArgs, TResult> {
  execute: (args: TArgs) => Promise<TResult | null>;
  data: TResult | null;
  error: AppError | null;
  isLoading: boolean;
  reset: () => void;
}

/**
 * Wraps any async function (Convex mutation, server action, fetch)
 * with normalized error state.
 *
 * Usage:
 *   const { execute, error, isLoading } = useAction(submitScore);
 *   await execute({ unitId, score });
 */
export function useAction<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>
): UseActionReturn<TArgs, TResult> {
  const [state, setState] = useState<ActionState<TResult>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(
    async (args: TArgs): Promise<TResult | null> => {
      setState({ data: null, error: null, isLoading: true });
      try {
        const result = await fn(args);
        setState({ data: result, error: null, isLoading: false });
        return result;
      } catch (err) {
        const normalized = normalizeError(err);
        setState({ data: null, error: normalized, isLoading: false });
        return null;
      }
    },
    [fn]
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return { execute, ...state, reset };
}
```

### 3.2 Usage in a component

```typescript
"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAction } from "@/hooks/use-action";
import { ErrorMessage } from "@/components/ui/error-message";

export function SubmitButton({ unitId }: { unitId: Id<"units"> }) {
  const submitScore = useMutation(api.mutations.grammar.submitScore);
  const { execute, error, isLoading } = useAction(submitScore);

  const handleSubmit = async () => {
    const result = await execute({ unitId, score: 85 });
    if (result) {
      // success path
    }
    // error is automatically set — no try/catch needed here
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Saving…" : "Submit"}
      </button>

      {/* Drop this anywhere — it renders nothing when error is null */}
      <ErrorMessage error={error} />
    </div>
  );
}
```

---

## 4. UI Error Components

### 4.1 `<ErrorMessage />` — inline field/action errors

```typescript
// components/ui/error-message.tsx
import { AlertCircle } from "lucide-react";
import { type AppError, ERROR_LABELS } from "@/lib/errors";

interface ErrorMessageProps {
  error: AppError | null | undefined;
  className?: string;
}

/**
 * Renders nothing when error is null/undefined.
 * Always shows a safe, user-facing message.
 * Never renders raw error details in production.
 */
export function ErrorMessage({ error, className }: ErrorMessageProps) {
  if (!error) return null;

  // In production: use the safe label. In dev: also show the specific message.
  const message =
    process.env.NODE_ENV === "development"
      ? error.message
      : ERROR_LABELS[error.code] ?? ERROR_LABELS.INTERNAL_ERROR;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive ${className ?? ""}`}
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
```

### 4.2 `<ErrorBanner />` — page-level errors

```typescript
// components/ui/error-banner.tsx
import { AlertTriangle, RefreshCw } from "lucide-react";
import { type AppError, ERROR_LABELS } from "@/lib/errors";

interface ErrorBannerProps {
  error: AppError | null | undefined;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({ error, onRetry, className }: ErrorBannerProps) {
  if (!error) return null;

  const message =
    process.env.NODE_ENV === "development"
      ? error.message
      : ERROR_LABELS[error.code] ?? ERROR_LABELS.INTERNAL_ERROR;

  return (
    <div
      role="alert"
      className={`rounded-xl border border-destructive/30 bg-destructive/8 p-5 ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {ERROR_LABELS[error.code] ?? "Error"}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
```

### 4.3 Next.js `error.tsx` boundary — route-level errors

```typescript
// app/error.tsx  (catches unhandled throws during render)
"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js automatically sanitizes `error.message` in production
 * (replaced with a digest). Never render error.message in production UI.
 * Use your own safe messages instead.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to your error tracking service (Sentry, etc.)
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            An unexpected error occurred. Please try again.
          </p>
          {/* In dev only: show digest for debugging */}
          {process.env.NODE_ENV === "development" && error.digest && (
            <p className="text-xs text-muted-foreground font-mono mt-2">
              digest: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted/60 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
```

### 4.4 `not-found.tsx`

```typescript
// app/not-found.tsx
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <p className="text-5xl font-bold font-mono text-muted-foreground">
          404
        </p>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Page not found
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            The page you're looking for doesn't exist or has moved.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
```

---

## 5. Convex Query Error Handling in Components

Convex `useQuery` doesn't throw — it returns `undefined` (loading) or the data (including `null`). Handle the three states explicitly:

```typescript
// Pattern to follow in EVERY page that uses useQuery

const data = useQuery(api.queries.grammar.grammarBySlug, { level, slug });

// 1. Loading
if (data === undefined) return <YourSkeleton />;

// 2. Not found / unauthorized (query returned null)
if (data === null) notFound(); // or redirect to /sign-in for auth

// 3. Data ready
return <YourPage data={data} />;
```

---

## 6. Network / Fetch Errors

When calling external APIs or Next.js route handlers:

```typescript
// lib/fetch.ts

import { AppException } from "./errors";

interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Production-safe fetch wrapper.
 * Throws AppException — never raw Error.
 */
export async function safeFetch<T>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { timeout = 10_000, ...rest } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...rest, signal: controller.signal });

    if (!response.ok) {
      // Map HTTP status to AppException
      if (response.status === 401)
        throw new AppException("UNAUTHORIZED", "Please sign in.");
      if (response.status === 403)
        throw new AppException("FORBIDDEN", "Access denied.");
      if (response.status === 404)
        throw new AppException("NOT_FOUND", "Resource not found.");
      if (response.status >= 500)
        throw new AppException(
          "EXTERNAL_SERVICE_ERROR",
          "The server encountered an error. Please try again.",
        );
      throw new AppException("INTERNAL_ERROR", "An unexpected error occurred.");
    }

    return response.json() as Promise<T>;
  } catch (err) {
    if (err instanceof AppException) throw err;

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new AppException(
        "NETWORK_ERROR",
        "The request timed out. Check your connection.",
      );
    }

    throw new AppException(
      "NETWORK_ERROR",
      "Network error. Check your connection and try again.",
      { cause: err },
    );
  } finally {
    clearTimeout(timer);
  }
}
```

---

## 7. Next.js Server Actions

```typescript
// actions/example.ts
"use server";

import { AppException, normalizeError, type AppError } from "@/lib/errors";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: AppError };

/**
 * All server actions return ActionResult<T> — never throw to the client.
 * This preserves the error message safely across the server/client boundary.
 */
export async function myServerAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    // validation, auth, db work...
    if (!input) throw new AppException("VALIDATION_ERROR", "Input is required.");

    return { success: true, data: { id: "123" } };
  } catch (err) {
    return { success: false, error: normalizeError(err) };
  }
}

// ─── Client-side usage ──────────────────────────────────────────────────────

// const result = await myServerAction(formData);
// if (!result.success) {
//   setError(result.error);  // → <ErrorMessage error={error} />
//   return;
// }
// // use result.data
```

---

## 8. Rules Summary for Claude Code

These are absolute rules. Apply them to every file you generate.

| Context             | Rule                                                                      |
| ------------------- | ------------------------------------------------------------------------- |
| Convex **query**    | Return `null` for not-found/unauth. Never throw.                          |
| Convex **mutation** | Throw `AppException` with a safe `userMessage`. Never throw raw `Error`.  |
| React component     | Use `useAction()` hook for all mutations. Never raw try/catch inline.     |
| Query state         | Always handle `undefined` (loading) → `null` (not found) → data.          |
| UI error display    | Use `<ErrorMessage />` for inline, `<ErrorBanner />` for page-level.      |
| Server actions      | Always return `ActionResult<T>` — never throw across the boundary.        |
| External fetch      | Use `safeFetch()` — never raw `fetch()`.                                  |
| Error messages      | Only `AppException.userMessage` or `ERROR_LABELS[code]` in production UI. |
| Raw error details   | Only in `process.env.NODE_ENV === "development"` guards.                  |
| `error.tsx`         | Never render `error.message` — use static safe strings only.              |
| New error codes     | Add to `ErrorCode` union in `lib/errors.ts` first, then use.              |

---

## 9. File Structure

```
lib/
  errors.ts          ← ErrorCode, AppException, normalizeError, ERROR_LABELS
  fetch.ts           ← safeFetch wrapper

hooks/
  use-action.ts      ← useAction() hook for all mutations

components/ui/
  error-message.tsx  ← <ErrorMessage /> inline errors
  error-banner.tsx   ← <ErrorBanner /> page-level errors

app/
  error.tsx          ← Next.js route error boundary
  not-found.tsx      ← 404 page

convex/
  mutations/         ← throw AppException
  queries/           ← return null
```
