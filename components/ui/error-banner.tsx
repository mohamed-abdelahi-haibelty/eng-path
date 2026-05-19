import { AlertTriangle, RotateCcw } from "lucide-react";
import {
  type AppError,
  ERROR_LABELS,
  ERROR_TITLES,
} from "@/lib/errors";
import { cn } from "@/lib/utils";

interface ErrorBannerProps {
  error: AppError | null | undefined;
  onRetry?: () => void;
  className?: string;
}

/**
 * Page-level error block. Notion-calm card with a soft icon, title, body,
 * and an optional inline retry. Renders nothing when error is null.
 */
export function ErrorBanner({ error, onRetry, className }: ErrorBannerProps) {
  if (!error) return null;

  const title = ERROR_TITLES[error.code] ?? ERROR_TITLES.INTERNAL_ERROR;
  const message =
    process.env.NODE_ENV === "development"
      ? error.message
      : (ERROR_LABELS[error.code] ?? ERROR_LABELS.INTERNAL_ERROR);

  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-border bg-card px-5 py-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="h-4 w-4 shrink-0 mt-0.5 text-destructive"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">
            {title}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            {message}
          </p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
