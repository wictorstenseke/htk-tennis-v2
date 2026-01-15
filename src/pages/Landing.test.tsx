import { screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { renderWithQueryClient } from "@/test/utils";

import { Landing } from "./Landing";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

// Mock Firebase
vi.mock("@/lib/firebase", () => ({
  auth: {
    onAuthStateChanged: vi.fn((callback) => {
      callback(null);
      return vi.fn();
    }),
    currentUser: null,
  },
  db: {},
}));

// Mock auth functions
vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}));

describe("Landing", () => {
  it("renders the login form", () => {
    renderWithQueryClient(<Landing />);

    expect(
      screen.getByRole("heading", { name: /welcome back/i })
    ).toBeInTheDocument();
  });

  it("renders email and password fields", () => {
    renderWithQueryClient(<Landing />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders sign in button", () => {
    renderWithQueryClient(<Landing />);

    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });
});
