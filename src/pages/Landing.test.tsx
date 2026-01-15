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
      screen.getByRole("heading", { name: /htk tennis v2/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/hogelids tennis klubb/i)
    ).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    renderWithQueryClient(<Landing />);

    expect(screen.getByRole("link", { name: /view examples/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view on github/i })).toBeInTheDocument();
  });

  it("renders exactly 6 feature cards", () => {
    renderWithQueryClient(<Landing />);

    // Verify all 6 feature card titles are present
    const expectedCardTitles = [
      "Firebase Authentication",
      "Cloud Firestore",
      "Modern UI",
      "Type Safe",
      "Fast & Reliable",
      "Mobile Responsive",
    ];

    expectedCardTitles.forEach((title) => {
      expect(screen.getByRole("heading", { name: new RegExp(title, "i") })).toBeInTheDocument();
    });
  });

  it("renders all expected feature cards with correct titles", () => {
    renderWithQueryClient(<Landing />);

    // Check for all 6 feature card titles
    expect(screen.getByRole("heading", { name: /firebase authentication/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /cloud firestore/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /modern ui/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /type safe/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /fast & reliable/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /mobile responsive/i })).toBeInTheDocument();
  });
});
