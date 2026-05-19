import { ConvexError } from "convex/values";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PRECONDITION_FAILED"
  | "NETWORK_ERROR"
  | "DATABASE_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  | "INTERNAL_ERROR";

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: unknown;
  field?: string;
}

type AppExceptionPayload = {
  appError: true;
  code: ErrorCode;
  message: string;
  field?: string;
} & Record<string, string | boolean | undefined>;

/**
 * AppException extends ConvexError so that thrown errors are transported
 * across the Convex wire as structured data (`err.data`), instead of being
 * collapsed to a sanitized string. The client can read the code and message
 * reliably from `err.data`.
 */
export class AppException extends ConvexError<AppExceptionPayload> {
  readonly code: ErrorCode;
  readonly userMessage: string;
  readonly field?: string;

  constructor(
    code: ErrorCode,
    userMessage: string,
    options?: { field?: string; cause?: unknown },
  ) {
    super({
      appError: true,
      code,
      message: userMessage,
      ...(options?.field ? { field: options.field } : {}),
    });
    this.name = "AppException";
    this.code = code;
    this.userMessage = userMessage;
    this.field = options?.field;
    if (options?.cause) this.cause = options.cause;
  }
}

function isAppPayload(value: unknown): value is AppExceptionPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { appError?: unknown }).appError === true &&
    typeof (value as { code?: unknown }).code === "string" &&
    typeof (value as { message?: unknown }).message === "string"
  );
}

export function isAppException(err: unknown): err is AppException {
  if (err instanceof AppException) return true;
  if (err instanceof ConvexError && isAppPayload(err.data)) return true;
  return false;
}

export function normalizeError(err: unknown): AppError {
  if (err instanceof AppException) {
    return {
      code: err.code,
      message: err.userMessage,
      field: err.field,
    };
  }

  if (err instanceof ConvexError && isAppPayload(err.data)) {
    return {
      code: err.data.code,
      message: err.data.message,
      field: err.data.field,
    };
  }

  if (err instanceof Error) {
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

export const NETWORK_ERROR: AppError = {
  code: "NETWORK_ERROR",
  message: "Could not load. Check your connection and try again.",
};

export const ERROR_TITLES: Record<ErrorCode, string> = {
  UNAUTHORIZED: "Sign in required",
  FORBIDDEN: "Access denied",
  VALIDATION_ERROR: "Check your input",
  NOT_FOUND: "Not found",
  CONFLICT: "Already exists",
  PRECONDITION_FAILED: "Requirements not met",
  NETWORK_ERROR: "Connection issue",
  DATABASE_ERROR: "Database error",
  EXTERNAL_SERVICE_ERROR: "Service unavailable",
  INTERNAL_ERROR: "Something went wrong",
};
