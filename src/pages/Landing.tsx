import { useNavigate } from "@tanstack/react-router";

import { LoginForm } from "@/components/auth/LoginForm";

export const Landing = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate({ to: "/app" });
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
      <div className="mx-auto w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
};
