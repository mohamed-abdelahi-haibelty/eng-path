export function ReviewSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-10">
        <div className="h-3.5 w-40 bg-muted rounded mb-3" />
        <div className="h-9 w-72 bg-muted rounded" />
      </div>

      {/* Exercise list */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border-t border-border pt-6 pb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-4 w-6 bg-muted rounded shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-[82%]" />
            </div>
          </div>
          <div className="ml-7 space-y-2">
            {Array.from({ length: i % 2 === 0 ? 4 : 2 }).map((_, j) => (
              <div key={j} className="h-10 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      ))}

      {/* Submit area */}
      <div className="border-t border-border pt-6 mt-2">
        <div className="h-10 w-28 bg-muted rounded-lg" />
      </div>
    </div>
  );
}
