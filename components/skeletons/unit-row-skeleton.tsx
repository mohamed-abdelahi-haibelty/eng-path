import { Skeleton } from "@/components/ui/skeleton";

export function UnitRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-2 py-3 border-b border-border last:border-0">
      <Skeleton className="h-3 w-5 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-1 w-24 rounded-full" />
      </div>
    </div>
  );
}
