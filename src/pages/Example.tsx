import { useEffect } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

const COUNTER_STORAGE_KEY = "example-page-shared-counter";
const COUNTER_QUERY_KEY = ["shared-counter"] as const;
const BROADCAST_CHANNEL_NAME = "shared-counter-channel";

const getCounterFromStorage = (): number => {
  const stored = localStorage.getItem(COUNTER_STORAGE_KEY);
  if (stored === null) return 0;
  const parsed = Number.parseInt(stored, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const setCounterToStorage = async (value: number): Promise<number> => {
  localStorage.setItem(COUNTER_STORAGE_KEY, String(value));
  return value;
};

export function Example() {
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: COUNTER_QUERY_KEY,
    queryFn: getCounterFromStorage,
    staleTime: Infinity,
  });

  const counterMutation = useMutation({
    mutationFn: setCounterToStorage,
    onSuccess: (newValue) => {
      queryClient.setQueryData(COUNTER_QUERY_KEY, newValue);
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: "counter-update", value: newValue });
      channel.close();
    },
  });

  useEffect(() => {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "counter-update") {
        queryClient.setQueryData(COUNTER_QUERY_KEY, event.data.value);
      }
    };

    channel.addEventListener("message", handleMessage);

    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    };
  }, [queryClient]);

  const handleIncrement = () => {
    counterMutation.mutate(count + 1);
  };

  const handleDecrement = () => {
    counterMutation.mutate(count - 1);
  };

  const handleReset = () => {
    counterMutation.mutate(0);
  };

  return (
    <div className="flex flex-col space-y-8 py-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
          Example Page
        </h1>
        <p className="text-xl text-muted-foreground">
          This is an example page showing how components and layouts work
          together.
        </p>
      </div>

      {/* Content Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Counter Card */}
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm flex flex-col justify-center">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight text-center first:mt-0">
            Interactive Counter
          </h2>
          <div className="flex flex-col items-center space-y-4">
            <p className="text-4xl font-bold">{count}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                className="min-w-10"
                onClick={handleDecrement}
                variant="outline"
              >
                –
              </Button>
              <Button onClick={handleReset} variant="secondary">
                Reset
              </Button>
              <Button className="min-w-10" onClick={handleIncrement}>
                +
              </Button>
            </div>
          </div>
        </div>

        {/* Button Variants Card */}
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
            <div className="flex-1 min-w-0">
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-2">
                Default Buttons
              </h3>
              <div className="flex flex-col space-y-2">
                <Button>Default Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mb-2">
                Small Variants
              </h3>
              <div className="flex flex-col space-y-2">
                <Button size="sm">Default Button</Button>
                <Button size="sm" variant="secondary">
                  Secondary
                </Button>
                <Button size="sm" variant="outline">
                  Outline
                </Button>
                <Button size="sm" variant="ghost">
                  Ghost
                </Button>
                <Button size="sm" variant="destructive">
                  Destructive
                </Button>
                <Button size="sm" variant="link">
                  Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Content */}
      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 mb-4">
          Responsive Layout
        </h2>
        <p className="leading-7">
          This page uses a responsive grid layout that adapts to different
          screen sizes. On mobile, cards stack vertically. On tablet and
          desktop, they appear side by side. The AppShell provides consistent
          padding and max-width container across all pages.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" asChild>
          <Link to="/">← Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
