import { type ReactNode } from "react";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@/hooks/useAuth";
import { createMockAuthUser } from "@/test/factories";

// Mock Firebase auth module
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(),
}));

// Mock Firebase module
vi.mock("@/lib/firebase", () => ({
  auth: {},
  isFirebaseConfigured: true,
}));

import { onAuthStateChanged } from "firebase/auth";

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return <>{children}</>;
    };
  };

  it("should start with loading state when Firebase is configured", () => {
    vi.mocked(onAuthStateChanged).mockImplementation(() => {
      return () => {}; // Return unsubscribe function
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
  });

  it("should set user when auth state changes to signed in", async () => {
    const mockUser = createMockAuthUser({
      uid: "user-123",
      email: "test@example.com",
    });

    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      // Simulate user being signed in
      if (typeof callback === "function") {
        setTimeout(() => callback(mockUser as any), 0);
      }
      return () => {};
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
    expect(result.current.loading).toBe(false);
  });

  it("should set user to null when auth state changes to signed out", async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      // Simulate user being signed out
      if (typeof callback === "function") {
        setTimeout(() => callback(null), 0);
      }
      return () => {};
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });

  it("should cleanup subscription on unmount", () => {
    const unsubscribeMock = vi.fn();
    vi.mocked(onAuthStateChanged).mockReturnValue(unsubscribeMock);

    const { unmount } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(unsubscribeMock).not.toHaveBeenCalled();

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it("should handle multiple auth state changes", async () => {
    let authCallback: ((user: any) => void) | null = null;

    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      if (typeof callback === "function") {
        authCallback = callback;
      }
      return () => {};
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    const mockUser1 = createMockAuthUser({
      uid: "user-1",
      email: "user1@example.com",
    });

    // First sign in
    authCallback!(mockUser1 as any);

    await waitFor(() => {
      expect(result.current.user?.uid).toBe("user-1");
      expect(result.current.loading).toBe(false);
    });

    // Sign out
    authCallback!(null);

    await waitFor(() => {
      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
    });

    const mockUser2 = createMockAuthUser({
      uid: "user-2",
      email: "user2@example.com",
    });

    // Sign in with different user
    authCallback!(mockUser2 as any);

    await waitFor(() => {
      expect(result.current.user?.uid).toBe("user-2");
      expect(result.current.loading).toBe(false);
    });
  });
});
