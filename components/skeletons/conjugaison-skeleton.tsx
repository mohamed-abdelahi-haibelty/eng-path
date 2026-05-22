import { Skeleton } from "@/components/ui/skeleton";

export function ConjugaisonSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-44 rounded" />
      <div className="space-y-2 pt-6 border-t border-border">
        <Skeleton className="h-9 w-64 rounded" />
        <Skeleton className="h-4 w-40 rounded" />
      </div>
      <div className="pt-4 rounded-xl border border-border p-5 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
        ))}
      </div>
      <div className="pt-6 space-y-3">
        <Skeleton className="h-5 w-40 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
