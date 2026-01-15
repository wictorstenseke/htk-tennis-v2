import { screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { renderWithQueryClient } from "@/test/utils";

import { Landing } from "./Landing";

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock auth functions
vi.mock("@/lib/auth", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
}));

// Mock Firebase
vi.mock("@/lib/firebase", () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
    currentUser: null,
  },
  db: {},
}));

describe("Landing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when user is not authenticated", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null, loading: false });
    });

    it("renders the hero section", () => {
      renderWithQueryClient(<Landing />);

      expect(
        screen.getByRole("heading", { name: /welcome to htk tennis/i })
      ).toBeInTheDocument();
    });

    it("renders hero description", () => {
      renderWithQueryClient(<Landing />);

      expect(
        screen.getByText(/manage your tennis club with ease/i)
      ).toBeInTheDocument();
    });

    it("renders sign in button", () => {
      renderWithQueryClient(<Landing />);

      expect(
        screen.getByRole("button", { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it("does not render login form fields directly", () => {
      renderWithQueryClient(<Landing />);

      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    });
  });

  describe("when user is authenticated", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: { email: "test@example.com", uid: "123" },
        loading: false,
      });
    });

    it("renders welcome message with user email", () => {
      renderWithQueryClient(<Landing />);

      expect(
        screen.getByRole("heading", { name: /welcome back!/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });

    it("renders go to app button", () => {
      renderWithQueryClient(<Landing />);

      expect(
        screen.getByRole("link", { name: /go to app/i })
      ).toBeInTheDocument();
    });

    it("does not render login form", () => {
      renderWithQueryClient(<Landing />);

      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    });
  });

  describe("when loading", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null, loading: true });
    });

    it("renders loading state", () => {
      renderWithQueryClient(<Landing />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });
});
