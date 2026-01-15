import { useState } from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { AuthDialog } from "@/components/auth/AuthDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const handleLoginSuccess = () => {
    setAuthDialogOpen(false);
    navigate({ to: "/app" });
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div className="mx-auto w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground">
              You're signed in as <span className="font-medium">{user.email}</span>
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/app">Go to App</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="flex min-h-[calc(100vh-200px)] items-center justify-center py-12 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Welcome to HTK Tennis
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl md:text-2xl">
              Manage your tennis club with ease. Sign in to get started and access all features.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Button size="lg" onClick={() => setAuthDialogOpen(true)}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
};
