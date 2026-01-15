import { createFileRoute, redirect } from "@tanstack/react-router";

import { auth } from "@/lib/firebase";
import { App } from "@/pages/App";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    // Wait for auth to initialize
    await new Promise<void>((resolve) => {
      const unsubscribe = auth.onAuthStateChanged(() => {
        unsubscribe();
        resolve();
      });
    });

    const user = auth.currentUser;
    
    if (!user) {
      throw redirect({ to: "/" });
    }
  },
  component: App,
});
