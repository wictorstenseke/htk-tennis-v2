import { createFileRoute } from "@tanstack/react-router";

import { Example } from "@/pages/Example";

export const Route = createFileRoute("/example")({
  component: Example,
});

