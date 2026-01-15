import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { renderWithQueryClient } from "@/test/utils";

import { Example } from "./Example";

// Mock TanStack Router Link component
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  private listeners: Map<string, ((event: MessageEvent) => void)[]> = new Map();

  constructor(name: string) {
    this.name = name;
  }

  postMessage(message: unknown) {
    // Simulate message delivery
    const event = new MessageEvent("message", { data: message });
    const listeners = this.listeners.get("message") || [];
    listeners.forEach((listener) => listener(event));
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)?.push(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  close() {
    this.listeners.clear();
  }
}

// @ts-expect-error - Mocking BroadcastChannel
global.BroadcastChannel = MockBroadcastChannel;

describe("Example", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it("renders the page title and description", () => {
    renderWithQueryClient(<Example />);

    expect(
      screen.getByRole("heading", { name: /example page/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/this is an example page showing how components/i)
    ).toBeInTheDocument();
  });

  it("displays the counter with initial value of 0", async () => {
    renderWithQueryClient(<Example />);

    // Wait for the counter to be displayed
    await waitFor(() => {
      const counterDisplay = screen.getByText("0");
      expect(counterDisplay).toBeInTheDocument();
    });
  });

  it("increments the counter when + button is clicked", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Example />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    // Click the increment button
    const incrementButton = screen.getByRole("button", { name: "+" });
    await user.click(incrementButton);

    // Check if counter incremented
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  it("decrements the counter when – button is clicked", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Example />);

    // Wait for initial render and increment first
    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    const incrementButton = screen.getByRole("button", { name: "+" });
    await user.click(incrementButton);

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    // Now decrement
    const decrementButton = screen.getByRole("button", { name: "–" });
    await user.click(decrementButton);

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  it("resets the counter when Reset button is clicked", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Example />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    // Increment the counter a few times
    const incrementButton = screen.getByRole("button", { name: "+" });
    await user.click(incrementButton);
    await user.click(incrementButton);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    // Click reset
    const resetButton = screen.getByRole("button", { name: /reset/i });
    await user.click(resetButton);

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  it("displays different button variants", () => {
    renderWithQueryClient(<Example />);

    // Check for various button variants (using getAllBy since there are multiple)
    const defaultButtons = screen.getAllByRole("button", { name: /default button/i });
    expect(defaultButtons.length).toBeGreaterThan(0);
    
    const secondaryButtons = screen.getAllByRole("button", { name: /^secondary$/i });
    expect(secondaryButtons.length).toBeGreaterThan(0);
    
    const outlineButtons = screen.getAllByRole("button", { name: /^outline$/i });
    expect(outlineButtons.length).toBeGreaterThan(0);
    
    const ghostButtons = screen.getAllByRole("button", { name: /^ghost$/i });
    expect(ghostButtons.length).toBeGreaterThan(0);
    
    const destructiveButtons = screen.getAllByRole("button", { name: /destructive/i });
    expect(destructiveButtons.length).toBeGreaterThan(0);
  });

  it("persists counter value to localStorage", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Example />);

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    // Increment counter
    const incrementButton = screen.getByRole("button", { name: "+" });
    await user.click(incrementButton);

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    // Check localStorage
    const storedValue = localStorage.getItem("example-page-shared-counter");
    expect(storedValue).toBe("1");
  });

  it("loads counter value from localStorage on mount", async () => {
    // Set initial value in localStorage
    localStorage.setItem("example-page-shared-counter", "5");

    renderWithQueryClient(<Example />);

    // Wait for the counter to load the persisted value
    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  it("renders navigation link back to home", () => {
    renderWithQueryClient(<Example />);

    const backLink = screen.getByRole("link", { name: /back to home/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });
});
