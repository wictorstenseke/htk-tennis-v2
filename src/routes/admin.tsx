import { createFileRoute, redirect } from "@tanstack/react-router";

import { canAccessAdmin } from "@/lib/admin";
import { usersApi } from "@/lib/api";
import { waitForAuthReady } from "@/lib/auth";
import { Admin } from "@/pages/Admin";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const authUser = await waitForAuthReady();

    if (!authUser) {
      throw redirect({ to: "/" });
    }

    try {
      const user = await usersApi.getUser(authUser.uid);
      if (!canAccessAdmin(user)) {
        throw redirect({ to: "/" });
      }
    } catch {
      throw redirect({ to: "/" });
    }
  },
  component: Admin,
});
