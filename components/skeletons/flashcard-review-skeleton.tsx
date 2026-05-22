export function FlashcardReviewSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Progress counter */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-4 w-16 rounded bg-muted" />
      </div>

      {/* Card */}
      <div className="h-52 rounded-xl bg-muted" />

      {/* Tap hint */}
      <div className="flex justify-center">
        <div className="h-3.5 w-28 rounded bg-muted" />
      </div>
    </div>
  );
}
