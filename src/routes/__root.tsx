import { createRootRoute, Outlet } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultMode="system" storageKey="vite-ui-theme">
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster />
    </ThemeProvider>
  ),
});
