import { createFileRoute, redirect } from "@tanstack/react-router";

import { waitForAuthReady } from "@/lib/auth";
import { Profile } from "@/pages/Profile";

export const Route = createFileRoute("/profile")({
  beforeLoad: async () => {
    const user = await waitForAuthReady();

    if (!user) {
      throw redirect({ to: "/" });
    }
  },
  component: Profile,
});
