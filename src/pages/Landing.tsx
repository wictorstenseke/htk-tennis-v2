import { Link, useNavigate } from "@tanstack/react-router";

import { LoginForm } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleLoginSuccess = () => {
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
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <div className="mx-auto w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
};
