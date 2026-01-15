import { createFileRoute, redirect } from "@tanstack/react-router";

import { waitForAuthReady } from "@/lib/auth";
import { Landing } from "@/pages/Landing";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const user = await waitForAuthReady();
    
    // Redirect authenticated users to /app
    if (user) {
      throw redirect({ to: "/app" });
    }
  },
  component: Landing,
});

