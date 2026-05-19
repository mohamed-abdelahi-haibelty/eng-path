import { Skeleton } from "@/components/ui/skeleton";

export function ListeningSkeleton() {
  return (
    <div className="space-y-10">
      {/* Header placeholder */}
      <div className="mb-10 space-y-2">
        <Skeleton className="h-3 w-36 rounded" />
        <Skeleton className="h-9 w-2/3 rounded" />
      </div>

      {/* Orb placeholder */}
      <div className="flex flex-col items-center gap-6 py-12">
        <Skeleton className="w-40 h-40 rounded-full" />
        <Skeleton className="h-4 w-24 rounded" />
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
