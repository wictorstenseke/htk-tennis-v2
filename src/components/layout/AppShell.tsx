import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { ModeToggle } from "@/components/mode-toggle";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">My App</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                to="/"
                className="transition-colors hover:text-foreground/80"
                activeProps={{ className: "text-foreground" }}
                inactiveProps={{ className: "text-foreground/60" }}
              >
                Home
              </Link>
              <Link
                to="/example"
                className="transition-colors hover:text-foreground/80"
                activeProps={{ className: "text-foreground" }}
                inactiveProps={{ className: "text-foreground/60" }}
              >
                Example
              </Link>
              <Link
                to="/query-demo"
                className="transition-colors hover:text-foreground/80"
                activeProps={{ className: "text-foreground" }}
                inactiveProps={{ className: "text-foreground/60" }}
              >
                Query Demo
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-8">
        <div className="container mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row lg:px-8">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with React, Vite, and shadcn/ui
          </p>
        </div>
      </footer>
    </div>
  );
}
