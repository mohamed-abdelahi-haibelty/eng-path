"use client";

import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut } from "lucide-react";

interface AppHeaderProps {
  left?: ReactNode;
}

export function AppHeader({ left }: AppHeaderProps) {
  const user = useQuery(api.queries.user.currentUser);
  const { signOut } = useAuthActions();
  const isLoading = user === undefined;
  const firstName = user?.name?.split(" ")[0] ?? null;

  return (
    <header className="sticky top-0 z-10 bg-card border-b border-border">
      <div className="max-w-3xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
        <div className="flex items-center min-w-0">{left}</div>
        <div className="flex items-center gap-2.5 shrink-0">
          {isLoading ? (
            <>
              <Skeleton className="h-4 w-20 hidden sm:block" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </>
          ) : (
            <>
              {firstName && (
                <span className="hidden sm:block text-sm text-muted-foreground">
                  {firstName}
                </span>
              )}
              <Avatar className="h-6 w-6">
                {user?.image && (
                  <AvatarImage src={user.image} alt={user.name ?? "User"} />
                )}
                <AvatarFallback className="text-[0.6875rem] font-bold">
                  {firstName?.[0] ?? "U"}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-md transition-colors duration-150 hover:bg-muted text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
