import { Skeleton } from "@/components/ui/skeleton";

export function LevelCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-5 flex flex-col gap-4 border border-border">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-8 rounded" />
        <Skeleton className="h-3 w-10" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>
      <Skeleton className="h-1 w-full rounded-full" />
    </div>
  );
}
