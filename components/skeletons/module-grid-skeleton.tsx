import { Skeleton } from "@/components/ui/skeleton";

interface ModuleGridSkeletonProps {
  count?: number;
}

export function ModuleGridSkeleton({ count = 6 }: ModuleGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-lg" />
      ))}
    </div>
  );
}
