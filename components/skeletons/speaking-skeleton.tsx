export function SpeakingSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Phase indicator */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-20 bg-muted rounded" />
        <div className="h-3 w-2 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
        <div className="h-3 w-2 bg-muted rounded" />
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-3 w-2 bg-muted rounded" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>

      {/* Instructions block */}
      <div className="space-y-4">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="space-y-2.5">
          <div className="h-3.5 w-full bg-muted rounded" />
          <div className="h-3.5 w-5/6 bg-muted rounded" />
          <div className="h-3.5 w-4/5 bg-muted rounded" />
          <div className="h-3.5 w-full bg-muted rounded" />
          <div className="h-3.5 w-3/4 bg-muted rounded" />
        </div>
      </div>

      {/* CTA */}
      <div className="pt-4 border-t border-border">
        <div className="h-10 w-32 bg-muted rounded-lg" />
      </div>
    </div>
  );
}
