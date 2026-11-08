import { AlertCircle } from "lucide-react";
import { type AppError, ERROR_LABELS } from "@/lib/errors";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  error: AppError | null | undefined;
  className?: string;
}

/**
 * Inline, Notion-calm error callout. Renders nothing when error is null.
 * Always shows a safe, user-facing message — never raw error details in prod.
 *
 * Note: error copy stays in English regardless of UI locale; localizing system
 * error messages costs more than it's worth for this app.
 */
export function ErrorMessage({ error, className }: ErrorMessageProps) {
  if (!error) return null;

  const message =
    process.env.NODE_ENV === "development"
      ? error.message
      : (ERROR_LABELS[error.code] ?? ERROR_LABELS.INTERNAL_ERROR);

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5",
        className,
      )}
    >
      <AlertCircle
        className="h-3.5 w-3.5 shrink-0 mt-0.5 text-destructive"
        aria-hidden="true"
      />
      <p className="text-sm text-foreground leading-snug">{message}</p>
    </div>
  );
}
