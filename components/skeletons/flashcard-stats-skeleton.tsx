export function FlashcardStatsSkeleton() {
  return (
    <div className="animate-pulse space-y-10">
      {/* Stat row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-2">
            <div className="h-3 w-14 rounded bg-muted" />
            <div className="h-7 w-10 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* State breakdown */}
      <div className="space-y-3">
        <div className="h-3.5 w-24 rounded bg-muted" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-1.5">
              <div className="h-3 w-12 rounded bg-muted" />
              <div className="h-6 w-8 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="space-y-3">
        <div className="h-3.5 w-32 rounded bg-muted" />
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(13, minmax(0, 1fr))" }}>
          {[...Array(91)].map((_, i) => (
            <div key={i} className="aspect-square rounded-sm bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
