import { createFileRoute, redirect } from "@tanstack/react-router";

import { waitForAuthReady } from "@/lib/auth";
import { App } from "@/pages/App";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const user = await waitForAuthReady();
    
    if (!user) {
      throw redirect({ to: "/" });
    }
  },
  component: App,
});
