import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-6 sm:px-8 py-24 sm:py-32">
        <div className="space-y-8">
          <Eyebrow>404 · Not found</Eyebrow>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              Page not found
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-md">
              The page you&apos;re looking for doesn&apos;t exist, has moved,
              or you don&apos;t have access to it.
            </p>
          </div>

          <div className="pt-2">
            <Button render={<Link href="/" />}>
              Go home
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
