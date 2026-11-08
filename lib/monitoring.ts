import * as Sentry from "@sentry/nextjs";
import { ConvexError } from "convex/values";
import { isAppException, type ErrorCode } from "./errors";

// Expected business-logic outcomes — not bugs, not reported to Sentry.
const EXPECTED_ERROR_CODES = new Set<ErrorCode>([
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "PRECONDITION_FAILED",
  "VALIDATION_ERROR",
]);

function isExpectedConvexError(err: unknown): boolean {
  if (!(err instanceof ConvexError)) return false;
  const data = err.data as { appError?: boolean; code?: string } | undefined;
  return (
    data?.appError === true &&
    typeof data.code === "string" &&
    EXPECTED_ERROR_CODES.has(data.code as ErrorCode)
  );
}

/**
 * Report unexpected errors to Sentry from Next.js code only.
 * Never import this file from Convex functions.
 */
export function captureError(
  err: unknown,
  context?: Record<string, unknown>,
): void {
  if (isAppException(err) && EXPECTED_ERROR_CODES.has(err.code)) return;
  if (isExpectedConvexError(err)) return;

  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    Sentry.captureException(err);
  });
}
