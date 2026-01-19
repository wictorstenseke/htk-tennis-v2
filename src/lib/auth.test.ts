// Mock Firebase auth module
vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

// Mock Firebase module
vi.mock("@/lib/firebase", () => ({
  auth: {}, // Mock auth object
  isFirebaseConfigured: true,
}));

// Mock API module
vi.mock("@/lib/api", () => ({
  usersApi: {
    createUser: vi.fn(),
  },
}));

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
  type UserCredential,
} from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usersApi } from "@/lib/api";
import { signIn, signOut, signUp } from "@/lib/auth";
import { createMockAuthUser } from "@/test/factories";

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signIn", () => {
    it("should successfully sign in with valid credentials", async () => {
      const mockUser = createMockAuthUser({
        uid: "user-123",
        email: "test@example.com",
      });
      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser as User,
      } as UserCredential);

      const user = await signIn("test@example.com", "password123");

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object),
        "test@example.com",
        "password123"
      );
      expect(user).toEqual(mockUser);
    });

    it("should throw error when Firebase auth fails", async () => {
      const authError = new Error("Invalid credentials");
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(authError);

      await expect(signIn("test@example.com", "wrongpass")).rejects.toThrow(
        "Invalid credentials"
      );
    });
  });

  describe("signUp", () => {
    it("should successfully create user with email and password", async () => {
      const mockUser = createMockAuthUser({
        uid: "new-user-123",
        email: "newuser@example.com",
      });
      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
        user: mockUser as User,
      } as UserCredential);
      vi.mocked(usersApi.createUser).mockResolvedValue({
        uid: "new-user-123",
        email: "newuser@example.com",
        ladderWins: 0,
        ladderLosses: 0,
        role: "user",
      });

      const user = await signUp("newuser@example.com", "password123");

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object),
        "newuser@example.com",
        "password123"
      );
      expect(usersApi.createUser).toHaveBeenCalledWith({
        uid: "new-user-123",
        email: "newuser@example.com",
        displayName: undefined,
      });
      expect(user).toEqual(mockUser);
    });

    it("should successfully create user with displayName", async () => {
      const mockUser = createMockAuthUser({
        uid: "new-user-123",
        email: "newuser@example.com",
        displayName: "John Doe",
      });
      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
        user: mockUser as User,
      } as UserCredential);
      vi.mocked(usersApi.createUser).mockResolvedValue({
        uid: "new-user-123",
        email: "newuser@example.com",
        displayName: "John Doe",
        ladderWins: 0,
        ladderLosses: 0,
        role: "user",
      });

      const user = await signUp("newuser@example.com", "password123", "John Doe");

      expect(usersApi.createUser).toHaveBeenCalledWith({
        uid: "new-user-123",
        email: "newuser@example.com",
        displayName: "John Doe",
      });
      expect(user).toEqual(mockUser);
    });

    it("should trim whitespace from displayName", async () => {
      const mockUser = createMockAuthUser({
        uid: "new-user-123",
        email: "newuser@example.com",
      });
      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
        user: mockUser as User,
      } as UserCredential);
      vi.mocked(usersApi.createUser).mockResolvedValue({
        uid: "new-user-123",
        email: "newuser@example.com",
        displayName: "Jane Doe",
        ladderWins: 0,
        ladderLosses: 0,
        role: "user",
      });

      await signUp("newuser@example.com", "password123", "  Jane Doe  ");

      expect(usersApi.createUser).toHaveBeenCalledWith({
        uid: "new-user-123",
        email: "newuser@example.com",
        displayName: "Jane Doe",
      });
    });

    it("should handle empty displayName", async () => {
      const mockUser = createMockAuthUser({
        uid: "new-user-123",
        email: "newuser@example.com",
      });
      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
        user: mockUser as User,
      } as UserCredential);
      vi.mocked(usersApi.createUser).mockResolvedValue({
        uid: "new-user-123",
        email: "newuser@example.com",
        ladderWins: 0,
        ladderLosses: 0,
        role: "user",
      });

      await signUp("newuser@example.com", "password123", "");

      expect(usersApi.createUser).toHaveBeenCalledWith({
        uid: "new-user-123",
        email: "newuser@example.com",
        displayName: undefined,
      });
    });

    it("should still return user when profile creation fails", async () => {
      const mockUser = createMockAuthUser({
        uid: "new-user-123",
        email: "newuser@example.com",
      });
      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
        user: mockUser as User,
      } as UserCredential);
      vi.mocked(usersApi.createUser).mockRejectedValue(
        new Error("Firestore error")
      );

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const user = await signUp("newuser@example.com", "password123");

      expect(user).toEqual(mockUser);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should throw error when Firebase auth fails", async () => {
      const authError = new Error("Email already in use");
      vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(authError);

      await expect(
        signUp("existing@example.com", "password123")
      ).rejects.toThrow("Email already in use");
    });
  });

  describe("signOut", () => {
    it("should successfully sign out user", async () => {
      vi.mocked(firebaseSignOut).mockResolvedValue(undefined);

      await signOut();

      expect(firebaseSignOut).toHaveBeenCalledWith(expect.any(Object));
    });

    it("should throw error when sign out fails", async () => {
      const signOutError = new Error("Network error");
      vi.mocked(firebaseSignOut).mockRejectedValue(signOutError);

      await expect(signOut()).rejects.toThrow("Network error");
    });
  });
});
