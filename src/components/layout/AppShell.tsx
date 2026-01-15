import type { ReactNode } from "react";
import { useState } from "react";

import { LogOutIcon, UserIcon } from "lucide-react";

import { Link, useNavigate } from "@tanstack/react-router";

import { AuthDialog } from "@/components/auth/AuthDialog";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate({ to: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleAuthSuccess = () => {
    setAuthDialogOpen(false);
    navigate({ to: "/app" });
  };

  const handleAppClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setAuthDialogOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-2 overflow-hidden px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <Link to="/" className="flex shrink-0 items-center space-x-2">
              <span className="font-bold text-sm sm:text-base">My App</span>
            </Link>
            <nav className="hidden items-center gap-3 text-sm font-medium sm:flex sm:gap-6">
              <Link
                to="/"
                className="transition-colors hover:text-foreground/80"
                activeProps={{ className: "text-foreground" }}
                inactiveProps={{ className: "text-foreground/60" }}
              >
                Home
              </Link>
              <Link
                to="/app"
                onClick={handleAppClick}
                className="transition-colors hover:text-foreground/80"
                activeProps={{ className: "text-foreground" }}
                inactiveProps={{ className: "text-foreground/60" }}
              >
                App
              </Link>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {!loading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 sm:gap-2">
                        <UserIcon className="h-4 w-4 shrink-0" />
                        <span className="hidden truncate sm:inline">{user.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel className="truncate max-w-[200px]">
                        {user.email}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOutIcon />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAuthDialogOpen(true)}
                    className="text-xs sm:text-sm"
                  >
                    Sign In
                  </Button>
                )}
              </>
            )}
            <ModeToggle />
          </div>
        </div>
      </header>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={handleAuthSuccess}
      />

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto max-w-screen-2xl px-2 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 sm:py-6 md:py-8">
        <div className="container mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-4 px-2 sm:px-4 md:flex-row md:px-6 lg:px-8">
          <p className="text-center text-xs sm:text-sm leading-loose text-muted-foreground md:text-left">
            Built with React, Vite, and shadcn/ui
          </p>
        </div>
      </footer>
    </div>
  );
}
