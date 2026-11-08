import { Skeleton } from "@/components/ui/skeleton";

export function ReadingSkeleton() {
  return (
    <div className="space-y-10">
      {/* Carousel placeholder */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-36 rounded" />
        <Skeleton className="h-52 w-full rounded-xl" />
        <div className="flex justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-1.5 w-6 rounded-full" />
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Passage placeholder */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-7 w-64 rounded" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4 rounded"
              style={{ width: `${85 + ((i * 7) % 15)}%` }}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Questions placeholder */}
      <div className="space-y-6">
        <Skeleton className="h-4 w-44 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-3/4 rounded" />
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
