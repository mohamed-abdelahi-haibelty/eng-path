"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  const { signIn } = useAuthActions();

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl">Eng Path</CardTitle>
          <CardDescription>Sign in to continue learning</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => void signIn("github", { redirectTo: "/" })}
          >
            Continue with GitHub
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
