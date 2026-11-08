export function WritingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-10">
        <div className="h-3.5 w-40 bg-muted rounded mb-3" />
        <div className="h-9 w-72 bg-muted rounded" />
      </div>

      {/* Phase indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-3 w-12 bg-muted rounded" />
        <div className="h-3 w-1 bg-muted rounded" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>

      {/* Prompt */}
      <div className="mb-6">
        <div className="h-3.5 w-24 bg-muted rounded mb-3" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-[92%]" />
          <div className="h-4 bg-muted rounded w-[85%]" />
          <div className="h-4 bg-muted rounded w-[78%]" />
        </div>
        <div className="flex gap-2 mt-3">
          <div className="h-3.5 w-16 bg-muted rounded" />
          <div className="h-3.5 w-20 bg-muted rounded" />
        </div>
      </div>

      {/* Vocab chips */}
      <div className="mb-6">
        <div className="h-3.5 w-36 bg-muted rounded mb-3" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-6 w-20 bg-muted rounded" />
          ))}
        </div>
      </div>

      {/* Paper editor placeholder */}
      <div className="bg-muted/40 rounded h-64" />

      {/* Word counter */}
      <div className="flex justify-end mt-2">
        <div className="h-3 w-24 bg-muted rounded" />
      </div>

      {/* Submit button */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="h-10 w-32 bg-muted rounded-lg" />
      </div>
    </div>
  );
}
