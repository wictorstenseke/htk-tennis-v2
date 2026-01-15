import React from "react";

import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { renderWithQueryClient } from "@/test/utils";

import { Landing } from "./Landing";

// Mock TanStack Router Link component
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

describe("Landing", () => {
  it("renders the hero section with title and description", () => {
    renderWithQueryClient(<Landing />);

    expect(
      screen.getByRole("heading", { name: /welcome to your app/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/a modern react boilerplate with vite/i)
    ).toBeInTheDocument();
  });

  it("renders all three action buttons", () => {
    renderWithQueryClient(<Landing />);

    expect(screen.getByRole("link", { name: /get started/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /query demo/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view on github/i })).toBeInTheDocument();
  });

  it("renders exactly 9 feature cards", () => {
    renderWithQueryClient(<Landing />);

    // Verify all 9 feature card titles are present (more reliable than counting generic headings)
    const expectedCardTitles = [
      "Fast Development",
      "Type Safe",
      "Modern UI",
      "TanStack Ecosystem",
      "Testing Ready",
      "CI/CD Ready",
      "ESLint & Prettier",
      "React 19",
      "Developer Experience",
    ];

    expectedCardTitles.forEach((title) => {
      expect(screen.getByRole("heading", { name: new RegExp(title, "i") })).toBeInTheDocument();
    });
  });

  it("renders all expected feature cards with correct titles", () => {
    renderWithQueryClient(<Landing />);

    // Check for all 9 feature card titles
    expect(screen.getByRole("heading", { name: /fast development/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /type safe/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /modern ui/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /tanstack ecosystem/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /testing ready/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /ci\/cd ready/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /eslint & prettier/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /react 19/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /developer experience/i })).toBeInTheDocument();
  });
});
