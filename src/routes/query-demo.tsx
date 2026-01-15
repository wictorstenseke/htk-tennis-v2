import { createFileRoute } from "@tanstack/react-router";

import { QueryDemo } from "@/pages/QueryDemo";

export const Route = createFileRoute("/query-demo")({
  component: QueryDemo,
});
