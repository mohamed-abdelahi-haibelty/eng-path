import { Skeleton } from "@/components/ui/skeleton";

export function UnitHeaderSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-32 rounded" />
      <Skeleton className="h-12 w-96 rounded" />
      <div className="space-y-4 pt-6 border-t border-border">
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
    </div>
  );
}
