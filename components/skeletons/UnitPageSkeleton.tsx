export function UnitPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back link skeleton */}
        <div className="mb-6 h-5 w-32 bg-muted rounded animate-pulse" />

        {/* Unit Header Skeleton */}
        <div className="mb-8">
          {/* Unit badge skeleton */}
          <div className="mb-4 h-6 w-40 bg-muted rounded animate-pulse" />

          {/* Title skeleton */}
          <div className="mb-4 h-10 w-64 bg-muted rounded animate-pulse" />

          {/* Info rows skeleton */}
          <div className="space-y-3">
            <div className="h-5 w-80 bg-muted rounded animate-pulse" />
            <div className="h-5 w-72 bg-muted rounded animate-pulse" />
            <div className="h-5 w-76 bg-muted rounded animate-pulse" />
          </div>
        </div>

        {/* Modules Grid Skeleton */}
        <div className="mb-4">
          <div className="h-6 w-40 bg-muted rounded animate-pulse mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-xl border border-border bg-card h-24 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
