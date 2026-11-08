import { Skeleton } from "@/components/ui/skeleton";

export function GrammarSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-28 rounded" />
      <div className="space-y-2 pt-6 border-t border-border">
        <Skeleton className="h-8 w-72 rounded" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
      <div className="space-y-3 pt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full max-w-2xl rounded" />
        ))}
      </div>
      <div className="pt-8 space-y-3">
        <Skeleton className="h-5 w-40 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
