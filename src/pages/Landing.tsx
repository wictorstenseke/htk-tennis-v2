import { useState } from "react";

import { ArrowRight } from "lucide-react";

import { Link, useNavigate } from "@tanstack/react-router";

import { AuthDialog } from "@/components/auth/AuthDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<"signin" | "signup">("signin");

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
      <section className="py-32">
        <div className="container">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Content Section - appears second on mobile, first on desktop */}
            <div className="order-2 lg:order-1 flex flex-col gap-5 items-center text-center lg:items-start lg:text-left">
              <h1 className="text-4xl font-bold text-pretty lg:text-6xl">
                Välkommen till HTK Tennis
              </h1>
              <p className="max-w-xl text-muted-foreground lg:text-xl">
                Hantera din tennisklubb med lätthet. Skapa konto eller logga in för att komma igång och få tillgång till alla funktioner.
              </p>
              <div className="flex w-full flex-col justify-center gap-2 sm:flex-row lg:justify-start">
                <Button
                  className="w-full sm:w-auto"
                  size="lg"
                  onClick={() => {
                    setAuthDialogMode("signup");
                    setAuthDialogOpen(true);
                  }}
                >
                  Skapa konto
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  size="lg"
                  onClick={() => {
                    setAuthDialogMode("signin");
                    setAuthDialogOpen(true);
                  }}
                >
                  Logga in
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
              <Badge variant="outline" className="mt-2">
                Hogelids Tennisklubb
                <ArrowRight className="ml-2 size-4" />
              </Badge>
            </div>
            
            {/* Image Section - appears first on mobile, second on desktop */}
            <img
              src="https://www.hogelidstennis.se/img/htk-logo.svg"
              alt="HTK Tennis Logo"
              className="order-1 lg:order-2 w-full max-w-md mx-auto lg:max-w-full rounded-md object-contain"
            />
          </div>
        </div>
      </section>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={handleLoginSuccess}
        defaultMode={authDialogMode}
      />
    </>
  );
};
