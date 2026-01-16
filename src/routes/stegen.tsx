import { createFileRoute } from "@tanstack/react-router";

import { Stegen } from "@/pages/Stegen";

export const Route = createFileRoute("/stegen")({
  component: Stegen,
});
